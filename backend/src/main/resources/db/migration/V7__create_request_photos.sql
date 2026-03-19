CREATE TABLE request_photos (
    id          BIGSERIAL PRIMARY KEY,
    request_id  BIGINT       NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    photo_url   VARCHAR(500) NOT NULL,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_photos_request ON request_photos (request_id);
