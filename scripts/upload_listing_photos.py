"""
Download free images from Unsplash and upload to MinIO for listing seed data.
Uses Unsplash Source (public, no API key needed) for royalty-free images.
"""

import io
import uuid
import urllib.request
import ssl
from minio import Minio

# MinIO config
MINIO_ENDPOINT = "localhost:19000"
ACCESS_KEY = "minioadmin"
SECRET_KEY = "minioadmin"
BUCKET = "agroconnect"

# Unsplash source URLs - small size (640px wide), specific search terms
# These are free-to-use images via Unsplash Source
LISTING_IMAGES = {
    # ANIMALS
    1: [  # Vacas leiteiras Holstein
        "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=640&q=80",  # Holstein cows
        "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=640&q=80",  # Dairy cows
    ],
    2: [  # Galinhas poedeiras
        "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=640&q=80",  # Chickens
        "https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=640&q=80",  # Hen
    ],
    3: [  # Vitelos Angus
        "https://images.unsplash.com/photo-1545468800-85cc9bc6ecf7?w=640&q=80",  # Calves
        "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=640&q=80",  # Beef cattle
    ],
    4: [  # Coelhos reprodutores
        "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=640&q=80",  # Rabbits
        "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=640&q=80",  # Rabbit
    ],
    # PLANTS
    5: [  # Mudas de pitaya
        "https://images.unsplash.com/photo-1527325678964-54e2dfc6a6bf?w=640&q=80",  # Dragon fruit plant
        "https://images.unsplash.com/photo-1604145559206-e3d358375a80?w=640&q=80",  # Pitaya
    ],
    6: [  # Bananeiras
        "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=640&q=80",  # Banana tree
        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=640&q=80",  # Banana plants
    ],
    7: [  # Hortensias azuis
        "https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=640&q=80",  # Blue hydrangeas
        "https://images.unsplash.com/photo-1530092285049-1c42085fd395?w=640&q=80",  # Hydrangea
    ],
    8: [  # Ananas dos Acores
        "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=640&q=80",  # Pineapple plant
        "https://images.unsplash.com/photo-1589820296156-2092d7e4a0cd?w=640&q=80",  # Pineapple growing
    ],
    # SEEDS
    9: [  # Sementes pastagem
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=640&q=80",  # Grass seeds
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=640&q=80",  # Green pasture
    ],
    10: [  # Sementes milho
        "https://images.unsplash.com/photo-1601593768498-8add029a3cbd?w=640&q=80",  # Corn seeds
        "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=640&q=80",  # Corn field
    ],
    11: [  # Mistura horticola
        "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=640&q=80",  # Seeds packets
        "https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=640&q=80",  # Vegetable seedlings
    ],
    # PRODUCE
    12: [  # Queijo Sao Jorge
        "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=640&q=80",  # Aged cheese
        "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=640&q=80",  # Cheese wheel
    ],
    13: [  # Mel dos Acores
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=640&q=80",  # Honey jar
        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=640&q=80",  # Honey comb
    ],
    14: [  # Ananas caixa
        "https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=640&q=80",  # Pineapples
        "https://images.unsplash.com/photo-1587883012610-e3df17d41270?w=640&q=80",  # Tropical fruit box
    ],
    15: [  # Leite fresco
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=640&q=80",  # Fresh milk
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=640&q=80",  # Milk bottles
    ],
    # EQUIPMENT
    16: [  # Grade de discos
        "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=640&q=80",  # Farm equipment
        "https://images.unsplash.com/photo-1592805723127-004b174a205c?w=640&q=80",  # Tractor with implements
    ],
    17: [  # Pulverizador
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=640&q=80",  # Garden sprayer context
        "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=640&q=80",  # Farm tools
    ],
    18: [  # Sistema rega
        "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=640&q=80",  # Drip irrigation
        "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=640&q=80",  # Irrigation system
    ],
}

# SSL context to handle certificate issues
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def download_image(url: str) -> bytes:
    """Download image from URL, following redirects."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return resp.read()


def main():
    client = Minio(
        MINIO_ENDPOINT,
        access_key=ACCESS_KEY,
        secret_key=SECRET_KEY,
        secure=False,
    )

    # Ensure bucket exists
    if not client.bucket_exists(BUCKET):
        client.make_bucket(BUCKET)
        print(f"Created bucket: {BUCKET}")

    # Set bucket policy to public read
    import json
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{BUCKET}/*"],
            }
        ],
    }
    client.set_bucket_policy(BUCKET, json.dumps(policy))
    print("Set bucket policy to public read")

    # SQL statements to update photo URLs
    sql_statements = []
    photo_id = 1  # Seed starts at id 1

    for listing_id, urls in LISTING_IMAGES.items():
        for sort_order, url in enumerate(urls):
            object_key = f"listings/{listing_id}/{uuid.uuid4()}.jpg"

            print(f"Downloading listing {listing_id} photo {sort_order}... ", end="", flush=True)
            try:
                data = download_image(url)
                print(f"{len(data)//1024}KB... ", end="", flush=True)

                client.put_object(
                    BUCKET,
                    object_key,
                    io.BytesIO(data),
                    length=len(data),
                    content_type="image/jpeg",
                )

                public_url = f"http://localhost:19000/{BUCKET}/{object_key}"
                sql_statements.append(
                    f"UPDATE listing_photos SET photo_url = '{public_url}' "
                    f"WHERE listing_id = {listing_id} AND sort_order = {sort_order};"
                )
                print(f"OK -> {object_key}")

            except Exception as e:
                print(f"FAILED: {e}")

    # Print SQL to update the database
    print("\n--- SQL to update photo URLs ---")
    print("-- Run this against the PostgreSQL database:")
    for stmt in sql_statements:
        print(stmt)

    # Write SQL to file
    with open("/c/AgroConnect/scripts/update_photo_urls.sql", "w") as f:
        f.write("-- Update listing photo URLs to point to MinIO\n")
        f.write("-- Generated by upload_listing_photos.py\n\n")
        for stmt in sql_statements:
            f.write(stmt + "\n")

    print(f"\nDone! {len(sql_statements)} photos uploaded.")
    print("SQL written to /c/AgroConnect/scripts/update_photo_urls.sql")
    print("Run: docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect < scripts/update_photo_urls.sql")


if __name__ == "__main__":
    main()
