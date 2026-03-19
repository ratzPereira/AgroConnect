CREATE TABLE provider_profiles (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL UNIQUE REFERENCES users(id),
    company_name      VARCHAR(255) NOT NULL,
    nif               VARCHAR(20)  NOT NULL UNIQUE,
    phone             VARCHAR(20),
    location          GEOMETRY(Point, 4326),
    parish            VARCHAR(255),
    municipality      VARCHAR(255),
    island            VARCHAR(100),
    service_radius_km DOUBLE PRECISION NOT NULL DEFAULT 25,
    avg_rating        DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_reviews     INTEGER      NOT NULL DEFAULT 0,
    profile_photo_url VARCHAR(500),
    bio               VARCHAR(1000),
    verified          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_profiles_user_id ON provider_profiles (user_id);
CREATE INDEX idx_provider_profiles_location ON provider_profiles USING GIST (location);
CREATE INDEX idx_provider_profiles_nif ON provider_profiles (nif);
CREATE INDEX idx_provider_profiles_verified ON provider_profiles (verified) WHERE verified = TRUE;
