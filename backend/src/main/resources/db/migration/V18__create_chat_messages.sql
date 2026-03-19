CREATE TABLE chat_messages (
    id         BIGSERIAL PRIMARY KEY,
    request_id BIGINT       NOT NULL REFERENCES service_requests(id),
    sender_id  BIGINT       NOT NULL REFERENCES users(id),
    content    VARCHAR(2000) NOT NULL,
    sent_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_request ON chat_messages (request_id, sent_at);
CREATE INDEX idx_chat_messages_sender ON chat_messages (sender_id);
