CREATE TABLE inventory (
    id              BIGSERIAL PRIMARY KEY,
    provider_id     BIGINT         NOT NULL REFERENCES provider_profiles(id),
    product_name    VARCHAR(255)   NOT NULL,
    unit            VARCHAR(20)    NOT NULL,
    quantity        DOUBLE PRECISION NOT NULL DEFAULT 0,
    min_stock_alert DOUBLE PRECISION,
    cost_per_unit   DECIMAL(10, 2),
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_inventory_unit CHECK (
        unit IN ('KG', 'L', 'UNIT')
    ),
    CONSTRAINT chk_inventory_quantity_positive CHECK (quantity >= 0)
);

CREATE INDEX idx_inventory_provider ON inventory (provider_id);
