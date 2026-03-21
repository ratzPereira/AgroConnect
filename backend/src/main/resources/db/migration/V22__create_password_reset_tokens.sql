CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    expires_at  TIMESTAMP    NOT NULL,
    used_at     TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_prt_user       ON password_reset_tokens(user_id);
