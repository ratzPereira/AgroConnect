CREATE TABLE execution_assignments (
    id              BIGSERIAL PRIMARY KEY,
    execution_id    BIGINT NOT NULL REFERENCES service_executions(id),
    team_member_id  BIGINT NOT NULL REFERENCES team_members(id),
    machine_id      BIGINT REFERENCES machines(id),
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_execution_member UNIQUE (execution_id, team_member_id)
);

CREATE INDEX idx_exec_assignments_execution ON execution_assignments (execution_id);
CREATE INDEX idx_exec_assignments_member ON execution_assignments (team_member_id);
