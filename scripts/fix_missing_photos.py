"""Fix the 5 failed photo downloads with alternative URLs."""

import io
import uuid
import urllib.request
import ssl
from minio import Minio

MINIO_ENDPOINT = "localhost:19000"
ACCESS_KEY = "minioadmin"
SECRET_KEY = "minioadmin"
BUCKET = "agroconnect"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Replacement URLs for failed downloads
FIXES = {
    (5, 0): "https://images.unsplash.com/photo-1600423115367-87ea7661688f?w=640&q=80",   # Dragon fruit
    (5, 1): "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=640&q=80",   # Cactus/succulent
    (8, 1): "https://images.unsplash.com/photo-1587883012610-e3df17d41270?w=640&q=80",   # Pineapple
    (10, 0): "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=640&q=80",  # Corn
    (16, 1): "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=640&q=80",  # Farm machinery
}

def download_image(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return resp.read()

def main():
    client = Minio(MINIO_ENDPOINT, access_key=ACCESS_KEY, secret_key=SECRET_KEY, secure=False)

    sql_lines = []
    for (listing_id, sort_order), url in FIXES.items():
        object_key = f"listings/{listing_id}/{uuid.uuid4()}.jpg"
        print(f"Downloading listing {listing_id} photo {sort_order}... ", end="", flush=True)
        try:
            data = download_image(url)
            print(f"{len(data)//1024}KB... ", end="", flush=True)
            client.put_object(BUCKET, object_key, io.BytesIO(data), length=len(data), content_type="image/jpeg")
            public_url = f"http://localhost:19000/{BUCKET}/{object_key}"
            sql_lines.append(
                f"UPDATE listing_photos SET photo_url = '{public_url}' "
                f"WHERE listing_id = {listing_id} AND sort_order = {sort_order};"
            )
            print(f"OK")
        except Exception as e:
            print(f"FAILED: {e}")

    for s in sql_lines:
        print(s)

if __name__ == "__main__":
    main()
