CREATE TABLE machines (
    id                    BIGSERIAL PRIMARY KEY,
    provider_id           BIGINT       NOT NULL REFERENCES provider_profiles(id),
    name                  VARCHAR(255) NOT NULL,
    type                  VARCHAR(100),
    description           VARCHAR(500),
    status                VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    license_plate         VARCHAR(20),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_machine_status CHECK (
        status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED')
    )
);

CREATE INDEX idx_machines_provider ON machines (provider_id);
CREATE INDEX idx_machines_status ON machines (status);
