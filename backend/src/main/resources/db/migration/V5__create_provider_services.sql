CREATE TABLE provider_services (
    id          BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES provider_profiles(id),
    category_id BIGINT NOT NULL REFERENCES service_categories(id),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_provider_category UNIQUE (provider_id, category_id)
);

CREATE INDEX idx_provider_services_provider ON provider_services (provider_id);
CREATE INDEX idx_provider_services_category ON provider_services (category_id);
