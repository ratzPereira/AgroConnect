-- The Stripe charge ID created by a successful PaymentIntent. Captured from the
-- payment_intent.succeeded webhook so we can later pass it as source_transaction
-- when creating the Transfer to the provider's connected account (separate
-- charges and transfers pattern — Stripe enforces that we never transfer more
-- than was actually charged, and uses this link for reconciliation).
ALTER TABLE transactions
    ADD COLUMN stripe_charge_id VARCHAR(255);
