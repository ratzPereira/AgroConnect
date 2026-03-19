CREATE TABLE service_categories (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    slug           VARCHAR(100) NOT NULL UNIQUE,
    description    VARCHAR(500),
    icon_url       VARCHAR(500),
    pricing_models TEXT[]       NOT NULL DEFAULT '{"FIXED"}',
    form_schema    JSONB,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order     INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_categories_slug ON service_categories (slug);
CREATE INDEX idx_service_categories_active ON service_categories (active) WHERE active = TRUE;
