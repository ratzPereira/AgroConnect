package com.agroconnect.service;

import com.agroconnect.dto.request.SendMessageDto;
import com.agroconnect.dto.response.ChatMessageResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.ChatMessageMapper;
import com.agroconnect.model.ChatMessage;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ChatMessageRepository;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private static final Set<RequestStatus> CHAT_ALLOWED_STATUSES = EnumSet.of(
            RequestStatus.AWARDED, RequestStatus.IN_PROGRESS,
            RequestStatus.AWAITING_CONFIRMATION, RequestStatus.COMPLETED,
            RequestStatus.DISPUTED);

    private final ChatMessageRepository chatMessageRepository;
    private final ServiceRequestRepository requestRepository;
    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public Page<ChatMessageResponse> getMessages(Long requestId, Long userId, boolean isAdmin, Pageable pageable) {
        ServiceRequest request = getRequest(requestId);
        if (!isAdmin) {
            validateParticipant(request, userId);
        }

        return chatMessageRepository.findByRequestIdOrderBySentAtAsc(requestId, pageable)
                .map(msg -> ChatMessageMapper.toResponse(msg, getDisplayName(msg.getSender().getId())));
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long requestId, SendMessageDto dto, Long userId) {
        ServiceRequest request = getRequest(requestId);

        if (!CHAT_ALLOWED_STATUSES.contains(request.getStatus())) {
            throw new InvalidStateException("O chat só está disponível para pedidos com estado entre AWARDED e COMPLETED/DISPUTED.");
        }

        validateParticipant(request, userId);

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        ChatMessage message = ChatMessage.builder()
                .request(request)
                .sender(sender)
                .content(dto.content())
                .sentAt(Instant.now())
                .build();

        message = chatMessageRepository.save(message);

        String senderName = getDisplayName(userId);
        ChatMessageResponse response = ChatMessageMapper.toResponse(message, senderName);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/request/" + requestId + "/chat",
                response
        );

        // Notify the other party
        Long recipientId = getRecipientId(request, userId);
        if (recipientId != null) {
            notificationService.create(
                    recipientId,
                    "NEW_MESSAGE",
                    "Nova mensagem",
                    senderName + " enviou uma mensagem no pedido \"" + request.getTitle() + "\".",
                    "{\"requestId\":" + requestId + "}"
            );
        }

        log.debug("Chat message {} sent by user {} on request {}", message.getId(), userId, requestId);
        return response;
    }

    private ServiceRequest getRequest(Long requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de serviço não encontrado."));
    }

    private void validateParticipant(ServiceRequest request, Long userId) {
        boolean isClient = request.getClient().getId().equals(userId);
        if (isClient) return;

        boolean isAcceptedProvider = proposalRepository.findByRequestId(request.getId()).stream()
                .filter(p -> p.getStatus() == ProposalStatus.ACCEPTED)
                .anyMatch(p -> p.getProvider().getUser().getId().equals(userId));

        if (!isAcceptedProvider) {
            throw new ForbiddenException("Apenas o cliente e o prestador aceite podem aceder ao chat.");
        }
    }

    private Long getRecipientId(ServiceRequest request, Long senderId) {
        Long clientId = request.getClient().getId();
        if (clientId.equals(senderId)) {
            // Sender is client, recipient is provider
            return proposalRepository.findByRequestId(request.getId()).stream()
                    .filter(p -> p.getStatus() == ProposalStatus.ACCEPTED)
                    .map(Proposal::getProvider)
                    .map(ProviderProfile::getUser)
                    .map(User::getId)
                    .findFirst()
                    .orElse(null);
        }
        return clientId;
    }

    private String getDisplayName(Long userId) {
        return clientProfileRepository.findByUserId(userId)
                .map(ClientProfile::getName)
                .orElseGet(() -> providerProfileRepository.findByUserId(userId)
                        .map(ProviderProfile::getCompanyName)
                        .orElse("Utilizador"));
    }
}
