-- V23: Add scheduling fields to service_executions for Gantt calendar
ALTER TABLE service_executions ADD COLUMN scheduled_date DATE;
ALTER TABLE service_executions ADD COLUMN scheduled_end_date DATE;

-- Index for calendar date range queries
CREATE INDEX idx_executions_scheduled_date ON service_executions (scheduled_date);
