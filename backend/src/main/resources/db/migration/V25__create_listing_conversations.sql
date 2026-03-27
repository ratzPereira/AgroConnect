CREATE TABLE listing_conversations (
    id              BIGSERIAL PRIMARY KEY,
    listing_id      BIGINT    NOT NULL REFERENCES listings(id),
    buyer_id        BIGINT    NOT NULL REFERENCES users(id),
    last_message_at TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_listing_buyer UNIQUE(listing_id, buyer_id)
);

CREATE INDEX idx_lconv_listing ON listing_conversations(listing_id);
CREATE INDEX idx_lconv_buyer   ON listing_conversations(buyer_id);

CREATE TABLE listing_messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT    NOT NULL REFERENCES listing_conversations(id),
    sender_id       BIGINT    NOT NULL REFERENCES users(id),
    content         TEXT      NOT NULL,
    read_at         TIMESTAMP,
    sent_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lmsg_conversation ON listing_messages(conversation_id, sent_at);
