CREATE TABLE reviews (
    id         BIGSERIAL PRIMARY KEY,
    request_id BIGINT       NOT NULL REFERENCES service_requests(id),
    author_id  BIGINT       NOT NULL REFERENCES users(id),
    target_id  BIGINT       NOT NULL REFERENCES users(id),
    rating     INTEGER      NOT NULL,
    comment    VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_review_author_request UNIQUE (request_id, author_id),
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_different_users CHECK (author_id <> target_id)
);

CREATE INDEX idx_reviews_request ON reviews (request_id);
CREATE INDEX idx_reviews_author ON reviews (author_id);
CREATE INDEX idx_reviews_target ON reviews (target_id);
