-- ═══════════════════════════════════════════════════════════════
-- AgroConnect — Job Costing (Phase 2 of provider overhaul)
-- ═══════════════════════════════════════════════════════════════
-- Goal: compute real profit margins per service execution.
--
--   revenue       = proposal.total_amount
--   materials     = SUM(execution_resource_usage.total_cost)
--   labor         = SUM(assignment.hours_worked * effective_rate)
--                   where effective_rate = COALESCE(hourly_rate_snapshot,
--                                                   team_member.hourly_rate, 0)
--   commission    = revenue * COMMISSION_RATE
--   netProfit     = revenue - materials - labor - commission
--
-- Changes:
--   1) Add hours_worked, machine_hours, hourly_rate_snapshot to
--      execution_assignments. Snapshot is locked at complete() so
--      historical jobs are immutable to later rate edits.
--   2) Add hourly_rate to team_members (the "current" rate).
--   3) Create execution_resource_usage — links inventory consumption
--      to specific service executions, with a snapshot of the WAC
--      at consumption time. total_cost is a generated column.
-- ═══════════════════════════════════════════════════════════════

-- 1) Costing fields on assignments
ALTER TABLE execution_assignments
    ADD COLUMN hours_worked          NUMERIC(6,2),
    ADD COLUMN machine_hours         NUMERIC(6,2),
    ADD COLUMN hourly_rate_snapshot  NUMERIC(8,2);

ALTER TABLE execution_assignments
    ADD CONSTRAINT chk_assignment_hours_nonneg
        CHECK (hours_worked IS NULL OR hours_worked >= 0),
    ADD CONSTRAINT chk_assignment_machine_hours_nonneg
        CHECK (machine_hours IS NULL OR machine_hours >= 0),
    ADD CONSTRAINT chk_assignment_rate_snapshot_nonneg
        CHECK (hourly_rate_snapshot IS NULL OR hourly_rate_snapshot >= 0);

-- 2) Hourly rate on the team member (current rate, can change over time)
ALTER TABLE team_members
    ADD COLUMN hourly_rate NUMERIC(8,2);

ALTER TABLE team_members
    ADD CONSTRAINT chk_team_member_hourly_rate_nonneg
        CHECK (hourly_rate IS NULL OR hourly_rate >= 0);

-- 3) Resource usage ledger — links to inventory_movements (CONSUMPTION row)
CREATE TABLE execution_resource_usage (
    id                    BIGSERIAL PRIMARY KEY,
    execution_id          BIGINT          NOT NULL REFERENCES service_executions(id) ON DELETE CASCADE,
    inventory_item_id     BIGINT          NOT NULL REFERENCES inventory(id),
    quantity              NUMERIC(14,3)   NOT NULL,
    unit_cost_snapshot    NUMERIC(10,4)   NOT NULL,
    total_cost            NUMERIC(14,4)   GENERATED ALWAYS AS (quantity * unit_cost_snapshot) STORED,
    notes                 VARCHAR(255),
    inventory_movement_id BIGINT          NOT NULL REFERENCES inventory_movements(id),
    recorded_by           BIGINT          NOT NULL REFERENCES users(id),
    created_at            TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_resource_usage_qty_positive CHECK (quantity > 0),
    CONSTRAINT chk_resource_usage_unit_cost_nonneg CHECK (unit_cost_snapshot >= 0)
);

CREATE INDEX idx_resource_usage_execution ON execution_resource_usage (execution_id);
CREATE INDEX idx_resource_usage_item ON execution_resource_usage (inventory_item_id);
CREATE INDEX idx_resource_usage_movement ON execution_resource_usage (inventory_movement_id);
