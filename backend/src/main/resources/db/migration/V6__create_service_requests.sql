CREATE TABLE service_requests (
    id                  BIGSERIAL PRIMARY KEY,
    client_id           BIGINT       NOT NULL REFERENCES users(id),
    category_id         BIGINT       NOT NULL REFERENCES service_categories(id),
    status              VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    title               VARCHAR(255) NOT NULL,
    description         TEXT         NOT NULL,
    location            GEOMETRY(Point, 4326) NOT NULL,
    parish              VARCHAR(255),
    municipality        VARCHAR(255),
    island              VARCHAR(100),
    area                DOUBLE PRECISION,
    area_unit           VARCHAR(20)  DEFAULT 'hectares',
    urgency             VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
    preferred_date_from DATE,
    preferred_date_to   DATE,
    form_data           JSONB,
    expires_at          TIMESTAMP,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_request_status CHECK (
        status IN ('DRAFT', 'PUBLISHED', 'WITH_PROPOSALS', 'AWARDED', 'IN_PROGRESS',
                   'AWAITING_CONFIRMATION', 'COMPLETED', 'RATED', 'DISPUTED', 'EXPIRED', 'CANCELLED')
    ),
    CONSTRAINT chk_request_urgency CHECK (
        urgency IN ('LOW', 'MEDIUM', 'HIGH')
    )
);

CREATE INDEX idx_requests_client ON service_requests (client_id);
CREATE INDEX idx_requests_category ON service_requests (category_id);
CREATE INDEX idx_requests_status ON service_requests (status);
CREATE INDEX idx_requests_location ON service_requests USING GIST (location);
CREATE INDEX idx_requests_created_at ON service_requests (created_at DESC);
CREATE INDEX idx_requests_expires_at ON service_requests (expires_at) WHERE expires_at IS NOT NULL;
