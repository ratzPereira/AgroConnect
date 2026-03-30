-- Fix materials_used column type from JSONB to TEXT
ALTER TABLE service_executions ALTER COLUMN materials_used TYPE TEXT;

-- Add dispute_reason column to service_requests
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS dispute_reason VARCHAR(2000);
