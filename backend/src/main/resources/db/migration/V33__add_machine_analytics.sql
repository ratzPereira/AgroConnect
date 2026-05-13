-- ═══════════════════════════════════════════════════════════════
-- AgroConnect — Machine Analytics (Phase 3 of provider overhaul)
-- ═══════════════════════════════════════════════════════════════
-- Goal: enable a deep per-machine view that surfaces, for a given
-- period, the jobs done, hours worked, revenue contributed,
-- utilization rate, maintenance cost, and operating expenses.
--
-- Two ledgers added — both append-only event tables anchored to
-- a machine. Hard deletes are allowed (admin-style cleanup); soft
-- delete adds no value here since the data is purely descriptive
-- and not referenced from elsewhere.
--
-- Analytics themselves are derived in MachineAnalyticsService from:
--   - execution_assignments (machine_hours, machine_id, completed_at)
--   - proposals (revenue per execution)
--   - machine_maintenance_logs (cost in period)
--   - machine_expenses (amount in period)
-- ═══════════════════════════════════════════════════════════════

-- 1) Maintenance ledger
CREATE TABLE machine_maintenance_logs (
    id                BIGSERIAL    PRIMARY KEY,
    machine_id        BIGINT       NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    maintenance_type  VARCHAR(20)  NOT NULL,
    description       VARCHAR(500) NOT NULL,
    cost              NUMERIC(10,2),
    workshop_name     VARCHAR(255),
    performed_at      DATE         NOT NULL,
    next_due_at       DATE,
    notes             TEXT,
    created_by        BIGINT       NOT NULL REFERENCES users(id),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_maintenance_type        CHECK (maintenance_type IN ('ROUTINE','REPAIR','INSPECTION')),
    CONSTRAINT chk_maintenance_cost_nonneg CHECK (cost IS NULL OR cost >= 0)
);

CREATE INDEX idx_maintenance_machine_date ON machine_maintenance_logs (machine_id, performed_at DESC);

-- 2) Expense ledger
CREATE TABLE machine_expenses (
    id           BIGSERIAL    PRIMARY KEY,
    machine_id   BIGINT       NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    category     VARCHAR(20)  NOT NULL,
    description  VARCHAR(255),
    amount       NUMERIC(10,2) NOT NULL,
    incurred_at  DATE         NOT NULL,
    notes        TEXT,
    created_by   BIGINT       NOT NULL REFERENCES users(id),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_expense_category        CHECK (category IN ('FUEL','PARTS','INSURANCE','TAX','OTHER')),
    CONSTRAINT chk_expense_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_expense_machine_date ON machine_expenses (machine_id, incurred_at DESC);
