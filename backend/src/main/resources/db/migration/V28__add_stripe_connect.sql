-- Stripe Connect: connected account tracking on provider profiles.
-- Capabilities mirror what Stripe reports via account.updated webhook so
-- we can short-circuit accept() when the provider isn't ready to receive funds.
ALTER TABLE provider_profiles
    ADD COLUMN stripe_account_id        VARCHAR(255),
    ADD COLUMN stripe_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN stripe_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN stripe_details_submitted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE provider_profiles
    ADD CONSTRAINT uq_provider_profiles_stripe_account UNIQUE (stripe_account_id);

CREATE INDEX idx_provider_profiles_stripe_account
    ON provider_profiles (stripe_account_id)
    WHERE stripe_account_id IS NOT NULL;

-- Webhook idempotency. INSERT ... ON CONFLICT DO NOTHING is the dedup primitive.
-- received_at is set on first delivery; processed_at on successful handler completion.
-- error_message records the last failure for observability when Stripe retries.
CREATE TABLE processed_stripe_events (
    event_id      VARCHAR(255) PRIMARY KEY,
    event_type    VARCHAR(100) NOT NULL,
    received_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    processed_at  TIMESTAMP,
    error_message TEXT
);

CREATE INDEX idx_processed_stripe_events_received_at
    ON processed_stripe_events (received_at DESC);

CREATE INDEX idx_processed_stripe_events_unprocessed
    ON processed_stripe_events (event_id)
    WHERE processed_at IS NULL;
