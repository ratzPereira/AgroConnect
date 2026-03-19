CREATE TABLE transactions (
    id                      BIGSERIAL PRIMARY KEY,
    request_id              BIGINT         NOT NULL UNIQUE REFERENCES service_requests(id),
    proposal_id             BIGINT         NOT NULL REFERENCES proposals(id),
    amount                  DECIMAL(10, 2) NOT NULL,
    commission_rate         DECIMAL(5, 4)  NOT NULL,
    commission_amount       DECIMAL(10, 2) NOT NULL,
    provider_payout         DECIMAL(10, 2) NOT NULL,
    status                  VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id      VARCHAR(255),
    held_at                 TIMESTAMP,
    released_at             TIMESTAMP,
    refunded_at             TIMESTAMP,
    created_at              TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_transaction_status CHECK (
        status IN ('PENDING', 'HELD', 'RELEASED', 'REFUNDED', 'PARTIALLY_REFUNDED')
    ),
    CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_request ON transactions (request_id);
