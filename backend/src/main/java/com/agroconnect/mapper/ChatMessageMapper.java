package com.agroconnect.mapper;

import com.agroconnect.dto.response.ChatMessageResponse;
import com.agroconnect.model.ChatMessage;

public final class ChatMessageMapper {

    private ChatMessageMapper() {}

    public static ChatMessageResponse toResponse(ChatMessage message, String senderName) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSender().getId(),
                senderName,
                message.getContent(),
                message.getSentAt()
        );
    }
}
