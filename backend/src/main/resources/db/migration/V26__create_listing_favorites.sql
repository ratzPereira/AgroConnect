CREATE TABLE listing_favorites (
    id         BIGSERIAL PRIMARY KEY,
    listing_id BIGINT    NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id    BIGINT    NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_listing_user_fav UNIQUE(listing_id, user_id)
);

CREATE INDEX idx_lfav_user ON listing_favorites(user_id);
