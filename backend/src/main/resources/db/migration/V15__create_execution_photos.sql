CREATE TABLE execution_photos (
    id           BIGSERIAL PRIMARY KEY,
    execution_id BIGINT       NOT NULL REFERENCES service_executions(id) ON DELETE CASCADE,
    photo_url    VARCHAR(500) NOT NULL,
    location     GEOMETRY(Point, 4326),
    taken_at     TIMESTAMP,
    uploaded_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_execution_photos_execution ON execution_photos (execution_id);
