CREATE TABLE listings (
    id               BIGSERIAL PRIMARY KEY,
    seller_id        BIGINT         NOT NULL REFERENCES users(id),
    category         VARCHAR(30)    NOT NULL,
    title            VARCHAR(200)   NOT NULL,
    description      TEXT           NOT NULL,
    price            DECIMAL(10,2),
    price_negotiable BOOLEAN        NOT NULL DEFAULT FALSE,
    condition        VARCHAR(20),
    quantity         DECIMAL(10,2),
    unit             VARCHAR(30),
    location         GEOMETRY(Point,4326) NOT NULL,
    location_name    VARCHAR(200),
    parish           VARCHAR(100),
    municipality     VARCHAR(100),
    island           VARCHAR(50)    NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    views_count      INTEGER        NOT NULL DEFAULT 0,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMP,

    CONSTRAINT chk_listing_status CHECK (status IN ('DRAFT','ACTIVE','SOLD','EXPIRED','REMOVED')),
    CONSTRAINT chk_listing_category CHECK (category IN ('ANIMALS','PLANTS','SEEDS','PRODUCE','EQUIPMENT')),
    CONSTRAINT chk_listing_condition CHECK (condition IS NULL OR condition IN ('NEW','USED','LIKE_NEW'))
);

CREATE INDEX idx_listings_seller   ON listings(seller_id);
CREATE INDEX idx_listings_status   ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_island   ON listings(island);
CREATE INDEX idx_listings_location ON listings USING GIST(location);
CREATE INDEX idx_listings_created  ON listings(created_at DESC);

CREATE TABLE listing_photos (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT       NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    photo_url   VARCHAR(500) NOT NULL,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_photos_listing ON listing_photos(listing_id);
