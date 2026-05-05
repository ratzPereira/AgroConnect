#!/bin/bash
# ──────────────────────────────────────────────────────────
# seed-minio-prod.sh
# Seeds the production MinIO with listing/request images
# and updates the DB photo URLs to the correct public path.
#
# Usage (on the droplet):
#   1. scp deploy/minio-seed.tar.gz root@<droplet>:/tmp/
#   2. scp deploy/seed-minio-prod.sh root@<droplet>:/tmp/
#   3. ssh root@<droplet>
#   4. chmod +x /tmp/seed-minio-prod.sh && /tmp/seed-minio-prod.sh
# ──────────────────────────────────────────────────────────

set -euo pipefail

TARBALL="/tmp/minio-seed.tar.gz"
MINIO_CONTAINER="agroconnect-minio"
POSTGRES_CONTAINER="agroconnect-postgres"
BUCKET="agroconnect"

# Read MINIO_PUBLIC_ENDPOINT from the backend container's env
MINIO_PUBLIC_ENDPOINT=$(docker exec agroconnect-backend printenv MINIO_PUBLIC_ENDPOINT 2>/dev/null || echo "https://agroconnect.pt/minio")

echo "==> MinIO public endpoint: $MINIO_PUBLIC_ENDPOINT"
echo "==> Bucket: $BUCKET"

# ── Step 1: Extract tarball and copy images into MinIO ──
echo ""
echo "==> Extracting images from tarball..."
rm -rf /tmp/minio-import
mkdir -p /tmp/minio-import
tar xzf "$TARBALL" -C /tmp/minio-import

echo "==> Copying images into MinIO container..."
docker cp /tmp/minio-import/listings "$MINIO_CONTAINER":/tmp/seed-listings
docker cp /tmp/minio-import/requests "$MINIO_CONTAINER":/tmp/seed-requests

echo "==> Uploading to MinIO bucket..."
docker exec "$MINIO_CONTAINER" mc alias set local http://localhost:9000 \
  "$(docker exec "$MINIO_CONTAINER" printenv MINIO_ROOT_USER)" \
  "$(docker exec "$MINIO_CONTAINER" printenv MINIO_ROOT_PASSWORD)"

docker exec "$MINIO_CONTAINER" mc cp --recursive /tmp/seed-listings/ "local/$BUCKET/listings/"
docker exec "$MINIO_CONTAINER" mc cp --recursive /tmp/seed-requests/ "local/$BUCKET/requests/"

echo "==> Cleaning up temp files in container..."
docker exec "$MINIO_CONTAINER" rm -rf /tmp/seed-listings /tmp/seed-requests

# ── Step 2: Verify images are in MinIO ──
echo ""
echo "==> Images in MinIO:"
docker exec "$MINIO_CONTAINER" mc ls --recursive "local/$BUCKET/listings/" | wc -l
echo "listing images"
docker exec "$MINIO_CONTAINER" mc ls --recursive "local/$BUCKET/requests/" | wc -l
echo "request images"

# ── Step 3: Read current photo URLs from local DB and build UPDATE statements ──
# We need to get the mapping from local (the tarball has the same file structure)
echo ""
echo "==> Reading DB credentials..."
DB_USER=$(docker exec "$POSTGRES_CONTAINER" printenv POSTGRES_USER)
DB_NAME=$(docker exec "$POSTGRES_CONTAINER" printenv POSTGRES_DB)

# Update listing_photos: replace any localhost or placeholder URLs
echo "==> Updating listing photo URLs in database..."
docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
  UPDATE listing_photos
  SET photo_url = REPLACE(photo_url, 'http://localhost:19000/agroconnect/', '${MINIO_PUBLIC_ENDPOINT}/agroconnect/')
  WHERE photo_url LIKE 'http://localhost:19000%';
"

# Update request_photos: same treatment
echo "==> Updating request photo URLs in database..."
docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
  UPDATE request_photos
  SET photo_url = REPLACE(photo_url, 'http://localhost:19000/agroconnect/', '${MINIO_PUBLIC_ENDPOINT}/agroconnect/')
  WHERE photo_url LIKE 'http://localhost:19000%';
"

# Also fix any placeholder URLs from the original V1001 seed migration
echo "==> Fixing placeholder URLs from seed migration..."

# Get all listing files from MinIO and update placeholder entries
for dir in /tmp/minio-import/listings/*/; do
  listing_id=$(basename "$dir")
  files=( "$dir"* )
  sort_order=0
  for file in "${files[@]}"; do
    filename=$(basename "$file")
    new_url="${MINIO_PUBLIC_ENDPOINT}/${BUCKET}/listings/${listing_id}/${filename}"
    # Update by listing_id and sort_order for placeholder URLs
    docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
      UPDATE listing_photos
      SET photo_url = '${new_url}'
      WHERE listing_id = ${listing_id}
        AND sort_order = ${sort_order}
        AND photo_url LIKE '/api/v1/placeholder%';
    "
    sort_order=$((sort_order + 1))
  done
done

# ── Step 4: Verify ──
echo ""
echo "==> Current listing photo URLs in DB:"
docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT photo_url FROM listing_photos ORDER BY listing_id, sort_order LIMIT 5;
"

echo ""
echo "==> Cleanup..."
rm -rf /tmp/minio-import

echo ""
echo "=== DONE ==="
echo "Listing images and request images are now in MinIO and DB URLs are updated."
echo "Test by visiting: ${MINIO_PUBLIC_ENDPOINT}/${BUCKET}/listings/1/ (should list files)"
