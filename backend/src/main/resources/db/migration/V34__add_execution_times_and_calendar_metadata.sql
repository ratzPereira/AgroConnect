-- ═══════════════════════════════════════════════════════════════
-- AgroConnect — Execution times for Calendar V2 (Dispatch & Operations Hub)
-- ═══════════════════════════════════════════════════════════════
-- Goal: enable hour-of-day scheduling on service executions so the
-- Day and Week Gantt views can position bars on a continuous time
-- axis (06:00-20:00, 30-minute slots).
--
-- Backwards-compatible: existing rows default to scheduled_all_day = TRUE
-- with NULL times, preserving the previous date-only semantics.
--
-- A CHECK constraint guarantees the (all_day, start_time, end_time)
-- triple stays internally consistent — the service layer also enforces
-- this with a clearer Portuguese error message before the DB sees it.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE service_executions
    ADD COLUMN scheduled_start_time TIME NULL,
    ADD COLUMN scheduled_end_time   TIME NULL,
    ADD COLUMN scheduled_all_day    BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE service_executions
    ADD CONSTRAINT chk_exec_times_consistency CHECK (
        (scheduled_all_day = TRUE
            AND scheduled_start_time IS NULL
            AND scheduled_end_time   IS NULL)
        OR
        (scheduled_all_day = FALSE
            AND scheduled_start_time IS NOT NULL
            AND scheduled_end_time   IS NOT NULL
            AND scheduled_end_time   > scheduled_start_time)
    );

-- Speed up the Day/Week range query on (proposal -> provider, scheduled_date, time)
CREATE INDEX IF NOT EXISTS idx_exec_proposal_date_time
    ON service_executions (proposal_id, scheduled_date, scheduled_start_time);
