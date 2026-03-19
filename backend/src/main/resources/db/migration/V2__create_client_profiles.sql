CREATE TABLE client_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL UNIQUE REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    location        GEOMETRY(Point, 4326),
    parish          VARCHAR(255),
    municipality    VARCHAR(255),
    island          VARCHAR(100),
    farm_type       VARCHAR(100),
    total_area_ha   DOUBLE PRECISION,
    profile_photo_url VARCHAR(500),
    bio             VARCHAR(1000),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_profiles_user_id ON client_profiles (user_id);
CREATE INDEX idx_client_profiles_location ON client_profiles USING GIST (location);
