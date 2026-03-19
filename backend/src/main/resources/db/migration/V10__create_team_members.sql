CREATE TABLE team_members (
    id          BIGSERIAL PRIMARY KEY,
    provider_id BIGINT       NOT NULL REFERENCES provider_profiles(id),
    user_id     BIGINT       REFERENCES users(id),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    role        VARCHAR(20)  NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    invited_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    joined_at   TIMESTAMP,

    CONSTRAINT uq_team_member_provider_email UNIQUE (provider_id, email),
    CONSTRAINT chk_team_member_role CHECK (
        role IN ('MANAGER', 'LEAD', 'OPERATOR')
    )
);

CREATE INDEX idx_team_members_provider ON team_members (provider_id);
CREATE INDEX idx_team_members_user ON team_members (user_id) WHERE user_id IS NOT NULL;
