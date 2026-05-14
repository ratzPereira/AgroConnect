package com.agroconnect.unit;

import com.agroconnect.dto.request.SendListingMessageDto;
import com.agroconnect.dto.response.ListingMessageResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Listing;
import com.agroconnect.model.ListingConversation;
import com.agroconnect.model.ListingMessage;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingStatus;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ListingConversationRepository;
import com.agroconnect.repository.ListingMessageRepository;
import com.agroconnect.repository.ListingRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.ListingMessageService;
import com.agroconnect.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingMessageServiceTest {

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Mock private ListingMessageRepository listingMessageRepository;
    @Mock private ListingConversationRepository listingConversationRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private NotificationService notificationService;
    @Mock private SimpMessagingTemplate messagingTemplate;

    private ListingMessageService service;

    private User sellerUser;
    private User buyerUser;
    private Listing activeListing;

    @BeforeEach
    void setUp() {
        service = new ListingMessageService(
                listingMessageRepository, listingConversationRepository, listingRepository,
                userRepository, clientProfileRepository, providerProfileRepository,
                notificationService, messagingTemplate);

        sellerUser = createTestUser(1L, Role.CLIENT);
        buyerUser = createTestUser(2L, Role.CLIENT);
        activeListing = createTestListing(10L, sellerUser, ListingStatus.ACTIVE);
    }

    // ── SEND FIRST MESSAGE ──

    @Test
    void sendFirstMessage_givenValidBuyer_shouldCreateConversationAndMessage() {
        SendListingMessageDto dto = new SendListingMessageDto("Bom dia, os vitelos ainda estão disponíveis?");

        ListingConversation savedConv = createConversation(1L, activeListing, buyerUser);
        ListingMessage savedMsg = createMessage(1L, savedConv, buyerUser, dto.content());

        when(listingRepository.findById(10L)).thenReturn(Optional.of(activeListing));
        when(userRepository.findById(2L)).thenReturn(Optional.of(buyerUser));
        when(listingConversationRepository.findByListingIdAndBuyerId(10L, 2L)).thenReturn(Optional.empty());
        when(listingConversationRepository.save(any(ListingConversation.class))).thenReturn(savedConv);
        when(listingMessageRepository.save(any(ListingMessage.class))).thenReturn(savedMsg);
        stubDisplayName(2L, "Pedro Santos");

        ListingMessageResponse response = service.sendFirstMessage(10L, dto, 2L);

        assertNotNull(response);
        assertEquals("Bom dia, os vitelos ainda estão disponíveis?", response.content());
        assertEquals("Pedro Santos", response.senderName());
        verify(listingConversationRepository, times(2)).save(any(ListingConversation.class));
        verify(notificationService).create(eq(1L), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void sendFirstMessage_givenSellerAsBuyer_shouldThrowForbidden() {
        SendListingMessageDto dto = new SendListingMessageDto("Mensagem teste");

        when(listingRepository.findById(10L)).thenReturn(Optional.of(activeListing));

        assertThrows(ForbiddenException.class, () -> service.sendFirstMessage(10L, dto, 1L));
    }

    @Test
    void sendFirstMessage_givenInactiveListing_shouldThrowInvalidState() {
        Listing soldListing = createTestListing(10L, sellerUser, ListingStatus.SOLD);
        SendListingMessageDto dto = new SendListingMessageDto("Ainda tem?");

        when(listingRepository.findById(10L)).thenReturn(Optional.of(soldListing));

        assertThrows(InvalidStateException.class, () -> service.sendFirstMessage(10L, dto, 2L));
    }

    @Test
    void sendFirstMessage_givenExistingConversation_shouldReuseIt() {
        SendListingMessageDto dto = new SendListingMessageDto("Voltei a contactar sobre o mesmo anúncio.");

        ListingConversation existingConv = createConversation(5L, activeListing, buyerUser);
        ListingMessage savedMsg = createMessage(2L, existingConv, buyerUser, dto.content());

        when(listingRepository.findById(10L)).thenReturn(Optional.of(activeListing));
        when(userRepository.findById(2L)).thenReturn(Optional.of(buyerUser));
        when(listingConversationRepository.findByListingIdAndBuyerId(10L, 2L)).thenReturn(Optional.of(existingConv));
        when(listingMessageRepository.save(any(ListingMessage.class))).thenReturn(savedMsg);
        when(listingConversationRepository.save(any(ListingConversation.class))).thenReturn(existingConv);
        stubDisplayName(2L, "Pedro Santos");

        ListingMessageResponse response = service.sendFirstMessage(10L, dto, 2L);

        assertNotNull(response);
        assertEquals(5L, existingConv.getId());
        verify(listingMessageRepository).save(any(ListingMessage.class));
    }

    // ── REPLY ──

    @Test
    void replyToConversation_givenParticipant_shouldSendMessage() {
        SendListingMessageDto dto = new SendListingMessageDto("Sim, ainda tenho disponível.");
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);
        ListingMessage savedMsg = createMessage(3L, conv, sellerUser, dto.content());

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(listingMessageRepository.save(any(ListingMessage.class))).thenReturn(savedMsg);
        when(listingConversationRepository.save(any(ListingConversation.class))).thenReturn(conv);
        stubDisplayName(1L, "João Silva");

        ListingMessageResponse response = service.replyToConversation(1L, dto, 1L);

        assertNotNull(response);
        assertEquals("Sim, ainda tenho disponível.", response.content());
        verify(notificationService).create(eq(2L), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void replyToConversation_givenNonParticipant_shouldThrowForbidden() {
        SendListingMessageDto dto = new SendListingMessageDto("Intruso");
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));

        assertThrows(ForbiddenException.class, () -> service.replyToConversation(1L, dto, 3L));
    }

    // ── GET MY CONVERSATIONS ──

    @Test
    void getMyConversations_givenSeller_shouldReturnSellerConversations() {
        Pageable pageable = PageRequest.of(0, 20);
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);
        Page<ListingConversation> convPage = new PageImpl<>(List.of(conv), pageable, 1);

        when(listingConversationRepository.findByParticipant(1L, pageable)).thenReturn(convPage);
        stubDisplayName(2L, "Pedro Santos");
        when(listingMessageRepository.findLastByConversationId(1L))
                .thenReturn(Optional.of(createMessage(1L, conv, buyerUser, "Última mensagem")));
        when(listingMessageRepository.countUnread(1L, 1L)).thenReturn(1L);

        var result = service.getMyConversations(1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getMyConversations_givenBuyer_shouldReturnBuyerConversations() {
        Pageable pageable = PageRequest.of(0, 20);
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);
        Page<ListingConversation> buyerPage = new PageImpl<>(List.of(conv), pageable, 1);

        when(listingConversationRepository.findByParticipant(2L, pageable)).thenReturn(buyerPage);
        stubDisplayName(1L, "João Silva");
        when(listingMessageRepository.findLastByConversationId(1L))
                .thenReturn(Optional.of(createMessage(1L, conv, sellerUser, "Resposta do vendedor")));
        when(listingMessageRepository.countUnread(1L, 2L)).thenReturn(0L);

        var result = service.getMyConversations(2L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    // ── MARK AS READ ──

    @Test
    void markAsRead_givenParticipant_shouldUpdateReadTimestamps() {
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(listingMessageRepository.markAsRead(eq(1L), eq(1L), any(Instant.class))).thenReturn(3);

        service.markAsRead(1L, 1L);

        verify(listingMessageRepository).markAsRead(eq(1L), eq(1L), any(Instant.class));
    }

    @Test
    void markAsRead_givenNonParticipant_shouldThrowForbidden() {
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));

        assertThrows(ForbiddenException.class, () -> service.markAsRead(1L, 3L));
    }

    // ── GET CONVERSATION MESSAGES ──

    @Test
    void getConversationMessages_givenParticipant_shouldReturnMessages() {
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);
        ListingMessage msg = createMessage(1L, conv, buyerUser, "Bom dia");
        Page<ListingMessage> msgPage = new PageImpl<>(List.of(msg));

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(listingMessageRepository.findByConversationIdOrderBySentAtAsc(eq(1L), any(Pageable.class)))
                .thenReturn(msgPage);
        stubDisplayName(2L, "Pedro Santos");

        var result = service.getConversationMessages(1L, 2L, PageRequest.of(0, 50));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Bom dia", result.getContent().get(0).content());
    }

    @Test
    void getConversationMessages_givenNonParticipant_shouldThrowForbidden() {
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));

        assertThrows(ForbiddenException.class,
                () -> service.getConversationMessages(1L, 3L, PageRequest.of(0, 50)));
    }

    @Test
    void getConversationMessages_givenNonExistentConversation_shouldThrowNotFound() {
        when(listingConversationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.agroconnect.exception.ResourceNotFoundException.class,
                () -> service.getConversationMessages(999L, 1L, PageRequest.of(0, 50)));
    }

    @Test
    void replyToConversation_givenBuyerSender_shouldNotifySeller() {
        SendListingMessageDto dto = new SendListingMessageDto("Quanto custa envio?");
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);
        ListingMessage savedMsg = createMessage(4L, conv, buyerUser, dto.content());

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(userRepository.findById(2L)).thenReturn(Optional.of(buyerUser));
        when(listingMessageRepository.save(any(ListingMessage.class))).thenReturn(savedMsg);
        when(listingConversationRepository.save(any(ListingConversation.class))).thenReturn(conv);
        stubDisplayName(2L, "Pedro Santos");

        ListingMessageResponse response = service.replyToConversation(1L, dto, 2L);

        assertNotNull(response);
        // Notification should go to seller (user 1)
        verify(notificationService).create(eq(1L), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void sendFirstMessage_givenNonExistentListing_shouldThrowNotFound() {
        SendListingMessageDto dto = new SendListingMessageDto("Test");
        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.agroconnect.exception.ResourceNotFoundException.class,
                () -> service.sendFirstMessage(999L, dto, 2L));
    }

    @Test
    void markAsRead_givenNonExistentConversation_shouldThrowNotFound() {
        when(listingConversationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.agroconnect.exception.ResourceNotFoundException.class,
                () -> service.markAsRead(999L, 1L));
    }

    @Test
    void getDisplayName_givenProviderUser_shouldReturnCompanyName() {
        // Test that provider users get company name displayed
        SendListingMessageDto dto = new SendListingMessageDto("Resposta do prestador.");
        ListingConversation conv = createConversation(1L, activeListing, buyerUser);
        ListingMessage savedMsg = createMessage(5L, conv, sellerUser, dto.content());

        when(listingConversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(listingMessageRepository.save(any(ListingMessage.class))).thenReturn(savedMsg);
        when(listingConversationRepository.save(any(ListingConversation.class))).thenReturn(conv);
        // No client profile for seller, has provider profile
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(1L)).thenReturn(
                Optional.of(com.agroconnect.model.ProviderProfile.builder()
                        .id(1L).companyName("Agro Terceira").build()));

        ListingMessageResponse response = service.replyToConversation(1L, dto, 1L);

        assertNotNull(response);
        assertEquals("Agro Terceira", response.senderName());
    }

    // ── Helper methods ──

    private User createTestUser(Long id, Role role) {
        return User.builder()
                .id(id)
                .email("user" + id + "@test.com")
                .passwordHash("$2a$12$hashedpassword")
                .role(role)
                .emailVerified(true)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private Listing createTestListing(Long id, User seller, ListingStatus status) {
        Point location = GF.createPoint(new Coordinate(-25.67, 37.74));
        location.setSRID(4326);
        return Listing.builder()
                .id(id)
                .seller(seller)
                .title("Vitelos Holstein")
                .description("3 vitelos com 6 meses")
                .category(ListingCategory.ANIMALS)
                .price(new BigDecimal("1200.00"))
                .priceNegotiable(false)
                .status(status)
                .location(location)
                .locationName("Angra do Heroísmo")
                .parish("Sé")
                .municipality("Angra do Heroísmo")
                .island("Terceira")
                .viewsCount(0)
                .photos(new ArrayList<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private ListingConversation createConversation(Long id, Listing listing, User buyer) {
        return ListingConversation.builder()
                .id(id)
                .listing(listing)
                .buyer(buyer)
                .lastMessageAt(Instant.now())
                .createdAt(Instant.now())
                .build();
    }

    private ListingMessage createMessage(Long id, ListingConversation conversation, User sender, String content) {
        return ListingMessage.builder()
                .id(id)
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .sentAt(Instant.now())
                .build();
    }

    private void stubDisplayName(Long userId, String name) {
        ClientProfile cp = ClientProfile.builder().id(userId).name(name).build();
        when(clientProfileRepository.findByUserId(userId)).thenReturn(Optional.of(cp));
    }
}
