CREATE TABLE service_executions (
    id                 BIGSERIAL PRIMARY KEY,
    proposal_id        BIGINT    NOT NULL UNIQUE REFERENCES proposals(id),
    checkin_location   GEOMETRY(Point, 4326),
    checkin_time       TIMESTAMP,
    checkout_time      TIMESTAMP,
    notes              TEXT,
    materials_used     JSONB,
    completed_at       TIMESTAMP,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_proposal ON service_executions (proposal_id);
