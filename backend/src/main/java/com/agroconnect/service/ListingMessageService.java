package com.agroconnect.service;

import com.agroconnect.dto.request.SendListingMessageDto;
import com.agroconnect.dto.response.ListingConversationResponse;
import com.agroconnect.dto.response.ListingMessageResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.ListingMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Listing;
import com.agroconnect.model.ListingConversation;
import com.agroconnect.model.ListingMessage;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ListingStatus;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ListingConversationRepository;
import com.agroconnect.repository.ListingMessageRepository;
import com.agroconnect.repository.ListingRepository;
import com.agroconnect.repository.ProviderProfileRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListingMessageService {

    private static final Logger log = LoggerFactory.getLogger(ListingMessageService.class);

    private final ListingMessageRepository listingMessageRepository;
    private final ListingConversationRepository listingConversationRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ListingMessageResponse sendFirstMessage(Long listingId, SendListingMessageDto dto, Long userId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado."));

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new InvalidStateException("Só é possível enviar mensagens para anúncios ativos.");
        }

        if (listing.getSeller().getId().equals(userId)) {
            throw new ForbiddenException("Não pode enviar mensagens no seu próprio anúncio.");
        }

        User buyer = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        // Find or create conversation
        ListingConversation conversation = listingConversationRepository
                .findByListingIdAndBuyerId(listingId, userId)
                .orElseGet(() -> {
                    ListingConversation newConv = ListingConversation.builder()
                            .listing(listing)
                            .buyer(buyer)
                            .build();
                    return listingConversationRepository.save(newConv);
                });

        Instant now = Instant.now();

        ListingMessage message = ListingMessage.builder()
                .conversation(conversation)
                .sender(buyer)
                .content(dto.content())
                .sentAt(now)
                .build();

        message = listingMessageRepository.save(message);

        conversation.setLastMessageAt(now);
        listingConversationRepository.save(conversation);

        String senderName = getDisplayName(userId);
        ListingMessageResponse response = ListingMapper.toMessageResponse(message, senderName);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/listing-conversation/" + conversation.getId(),
                response
        );

        // Notify the seller
        Long sellerId = listing.getSeller().getId();
        notificationService.create(
                sellerId,
                "LISTING_MESSAGE",
                "Nova mensagem",
                senderName + " enviou uma mensagem sobre o anúncio \"" + listing.getTitle() + "\".",
                "{\"listingId\":" + listingId + ",\"conversationId\":" + conversation.getId() + "}"
        );

        log.debug("First message {} sent by user {} on listing {}", message.getId(), userId, listingId);

        return response;
    }

    @Transactional
    public ListingMessageResponse replyToConversation(Long conversationId, SendListingMessageDto dto, Long userId) {
        ListingConversation conversation = listingConversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada."));

        validateParticipant(conversation, userId);

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        Instant now = Instant.now();

        ListingMessage message = ListingMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(dto.content())
                .sentAt(now)
                .build();

        message = listingMessageRepository.save(message);

        conversation.setLastMessageAt(now);
        listingConversationRepository.save(conversation);

        String senderName = getDisplayName(userId);
        ListingMessageResponse response = ListingMapper.toMessageResponse(message, senderName);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/listing-conversation/" + conversationId,
                response
        );

        // Notify the other party
        Long recipientId = getOtherPartyId(conversation, userId);
        Listing listing = conversation.getListing();
        notificationService.create(
                recipientId,
                "LISTING_MESSAGE",
                "Nova mensagem",
                senderName + " respondeu sobre o anúncio \"" + listing.getTitle() + "\".",
                "{\"listingId\":" + listing.getId() + ",\"conversationId\":" + conversationId + "}"
        );

        log.debug("Reply message {} sent by user {} in conversation {}", message.getId(), userId, conversationId);

        return response;
    }

    public Page<ListingConversationResponse> getMyConversations(Long userId, Pageable pageable) {
        // Returns all conversations where user is either seller or buyer
        Page<ListingConversation> conversations = listingConversationRepository.findByParticipant(userId, pageable);
        return conversations.map(conv -> mapConversation(conv, userId));
    }

    public Page<ListingMessageResponse> getConversationMessages(Long conversationId, Long userId, Pageable pageable) {
        ListingConversation conversation = listingConversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada."));

        validateParticipant(conversation, userId);

        return listingMessageRepository.findByConversationIdOrderBySentAtAsc(conversationId, pageable)
                .map(msg -> ListingMapper.toMessageResponse(msg, getDisplayName(msg.getSender().getId())));
    }

    @Transactional
    public void markAsRead(Long conversationId, Long userId) {
        ListingConversation conversation = listingConversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada."));

        validateParticipant(conversation, userId);

        int updated = listingMessageRepository.markAsRead(conversationId, userId, Instant.now());
        log.debug("Marked {} messages as read in conversation {} for user {}", updated, conversationId, userId);
    }

    private void validateParticipant(ListingConversation conversation, Long userId) {
        Long sellerId = conversation.getListing().getSeller().getId();
        Long buyerId = conversation.getBuyer().getId();

        if (!sellerId.equals(userId) && !buyerId.equals(userId)) {
            throw new ForbiddenException("Não tem permissão para aceder a esta conversa.");
        }
    }

    private Long getOtherPartyId(ListingConversation conversation, Long userId) {
        Long sellerId = conversation.getListing().getSeller().getId();
        Long buyerId = conversation.getBuyer().getId();
        return sellerId.equals(userId) ? buyerId : sellerId;
    }

    private ListingConversationResponse mapConversation(ListingConversation conv, Long currentUserId) {
        Long otherPartyId = getOtherPartyId(conv, currentUserId);
        String otherPartyName = getDisplayName(otherPartyId);

        String lastMessage = listingMessageRepository.findLastByConversationId(conv.getId())
                .map(ListingMessage::getContent)
                .orElse(null);

        long unreadCount = listingMessageRepository.countUnread(conv.getId(), currentUserId);

        return ListingMapper.toConversationResponse(conv, otherPartyName, otherPartyId, lastMessage, unreadCount);
    }

    private String getDisplayName(Long userId) {
        return clientProfileRepository.findByUserId(userId)
                .map(ClientProfile::getName)
                .orElseGet(() -> providerProfileRepository.findByUserId(userId)
                        .map(ProviderProfile::getCompanyName)
                        .orElse("Utilizador"));
    }
}
