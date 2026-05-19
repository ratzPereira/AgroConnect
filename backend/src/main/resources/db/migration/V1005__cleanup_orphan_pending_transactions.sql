-- V1005: Cleanup orphan PENDING transactions
--
-- Context: ProposalService.accept() creates a Transaction row (status=PENDING)
-- and a Stripe PaymentIntent BEFORE the user actually pays. If the user closes
-- the payment modal without paying, the PENDING row stays in the DB and blocks
-- any future re-acceptance of any proposal on the same request (ProposalService
-- raises InvalidStateException -> 409 Conflict).
--
-- This one-shot cleanup deletes PENDING transactions older than 30 minutes whose
-- request is still in WITH_PROPOSALS (i.e. payment never completed). HELD /
-- RELEASED / REFUNDED rows are never touched.
--
-- The proper fix is in ProposalService (idempotent resume or cancel-on-close);
-- this migration unblocks the demo while that lands.

DELETE FROM transactions t
USING service_requests r
WHERE t.request_id = r.id
  AND t.status = 'PENDING'
  AND r.status = 'WITH_PROPOSALS'
  AND t.created_at < NOW() - INTERVAL '30 minutes';
