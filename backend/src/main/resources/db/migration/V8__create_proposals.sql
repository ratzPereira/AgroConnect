CREATE TABLE proposals (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT         NOT NULL REFERENCES service_requests(id),
    provider_id     BIGINT         NOT NULL REFERENCES provider_profiles(id),
    status          VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    price           DECIMAL(10, 2) NOT NULL,
    pricing_model   VARCHAR(20)    NOT NULL DEFAULT 'FIXED',
    unit_price      DECIMAL(10, 2),
    estimated_units DOUBLE PRECISION,
    description     TEXT           NOT NULL,
    includes_text   TEXT,
    excludes_text   TEXT,
    estimated_date  DATE,
    valid_until     TIMESTAMP,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_proposal_provider_request UNIQUE (request_id, provider_id),
    CONSTRAINT chk_proposal_status CHECK (
        status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')
    ),
    CONSTRAINT chk_proposal_pricing CHECK (
        pricing_model IN ('FIXED', 'PER_UNIT', 'RECURRING')
    ),
    CONSTRAINT chk_proposal_price_positive CHECK (price > 0)
);

CREATE INDEX idx_proposals_request ON proposals (request_id);
CREATE INDEX idx_proposals_provider ON proposals (provider_id);
CREATE INDEX idx_proposals_status ON proposals (status);
