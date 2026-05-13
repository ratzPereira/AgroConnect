-- ═══════════════════════════════════════════════════════════════
-- AgroConnect — Inventory rebuild (Phase 1 of provider overhaul)
-- ═══════════════════════════════════════════════════════════════
-- Goal: turn `inventory` into an event-sourced model with weighted
-- average cost (WAC), full history, and soft-delete.
--
-- Changes:
--   1) Tighten `inventory.quantity` / `cost_per_unit` to NUMERIC for
--      exact arithmetic in BigDecimal.
--   2) Add `deleted_at` for soft-delete.
--   3) Create `inventory_movements` — append-only ledger of every
--      stock change (purchase, consumption, adjustment, initial).
--   4) Backfill an INITIAL movement for every existing item that
--      has positive stock so history is consistent from this point.
-- ═══════════════════════════════════════════════════════════════

-- 1) Tighten inventory column precision (compatible widening)
ALTER TABLE inventory
    ALTER COLUMN quantity        TYPE NUMERIC(14,3) USING quantity::NUMERIC(14,3),
    ALTER COLUMN min_stock_alert TYPE NUMERIC(14,3) USING min_stock_alert::NUMERIC(14,3),
    ALTER COLUMN cost_per_unit   TYPE NUMERIC(10,4) USING cost_per_unit::NUMERIC(10,4);

-- 2) Soft-delete column
ALTER TABLE inventory
    ADD COLUMN deleted_at TIMESTAMP NULL;

-- Replace the old broad index with a partial index over active rows
DROP INDEX IF EXISTS idx_inventory_provider;
CREATE INDEX idx_inventory_provider_active ON inventory (provider_id) WHERE deleted_at IS NULL;

-- 3) Event-sourced movements ledger
CREATE TABLE inventory_movements (
    id              BIGSERIAL PRIMARY KEY,
    item_id         BIGINT          NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type   VARCHAR(20)     NOT NULL,
    quantity_delta  NUMERIC(14,3)   NOT NULL,
    unit_cost       NUMERIC(10,4),
    quantity_after  NUMERIC(14,3)   NOT NULL,
    wac_after       NUMERIC(10,4)   NOT NULL,
    reason          VARCHAR(255),
    execution_id    BIGINT REFERENCES service_executions(id),
    actor_user_id   BIGINT          NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_movement_type CHECK (movement_type IN
        ('INITIAL','PURCHASE','CONSUMPTION','ADJUSTMENT_IN','ADJUSTMENT_OUT')),
    CONSTRAINT chk_movement_qty_nonzero CHECK (quantity_delta <> 0),
    CONSTRAINT chk_movement_qty_after_nonneg CHECK (quantity_after >= 0),
    CONSTRAINT chk_movement_wac_nonneg CHECK (wac_after >= 0),
    CONSTRAINT chk_movement_unit_cost_when_in CHECK (
        (movement_type IN ('PURCHASE','INITIAL') AND unit_cost IS NOT NULL AND unit_cost >= 0)
        OR (movement_type IN ('CONSUMPTION','ADJUSTMENT_OUT') AND unit_cost IS NULL)
        OR (movement_type = 'ADJUSTMENT_IN')
    )
);

CREATE INDEX idx_inv_mov_item_created ON inventory_movements (item_id, created_at DESC);
CREATE INDEX idx_inv_mov_execution ON inventory_movements (execution_id) WHERE execution_id IS NOT NULL;
CREATE INDEX idx_inv_mov_type ON inventory_movements (movement_type);

-- 4) Backfill INITIAL movements for existing inventory rows with stock > 0.
-- Each provider has a user_id (provider_profiles.user_id) — use that as actor.
INSERT INTO inventory_movements (
    item_id, movement_type, quantity_delta, unit_cost,
    quantity_after, wac_after, reason, actor_user_id
)
SELECT
    i.id,
    'INITIAL',
    i.quantity,
    COALESCE(i.cost_per_unit, 0),
    i.quantity,
    COALESCE(i.cost_per_unit, 0),
    'Backfill from V31 migration',
    pp.user_id
FROM inventory i
JOIN provider_profiles pp ON pp.id = i.provider_id
WHERE i.quantity > 0;
