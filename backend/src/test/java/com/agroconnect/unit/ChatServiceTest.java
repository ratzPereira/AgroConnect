package com.agroconnect.unit;

import com.agroconnect.dto.request.SendMessageDto;
import com.agroconnect.dto.response.ChatMessageResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
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
import com.agroconnect.service.ChatService;
import com.agroconnect.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private ServiceRequestRepository requestRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private NotificationService notificationService;
    @Mock private SimpMessagingTemplate messagingTemplate;

    private ChatService service;

    private User clientUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private ClientProfile clientProfile;
    private ServiceRequest awardedRequest;
    private Proposal acceptedProposal;

    @BeforeEach
    void setUp() {
        service = new ChatService(
                chatMessageRepository, requestRepository, proposalRepository,
                userRepository, clientProfileRepository, providerProfileRepository,
                notificationService, messagingTemplate);

        clientUser = UserFixture.aClientUser().build();
        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        clientProfile = UserFixture.aClientProfile().user(clientUser).build();

        awardedRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.AWARDED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        acceptedProposal = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(awardedRequest).provider(providerProfile).build();
    }

    @Test
    void sendMessage_givenClientSender_shouldSucceed() {
        SendMessageDto dto = new SendMessageDto("Bom dia, quando podem começar?");

        ChatMessage saved = ChatMessage.builder()
                .id(1L).request(awardedRequest).sender(clientUser)
                .content(dto.content()).sentAt(Instant.now()).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(saved);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

        ChatMessageResponse response = service.sendMessage(1L, dto, 1L);

        assertNotNull(response);
        verify(messagingTemplate).convertAndSend(eq("/topic/request/1/chat"), any(ChatMessageResponse.class));
        verify(notificationService).create(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void sendMessage_givenNonParticipant_shouldThrowForbidden() {
        SendMessageDto dto = new SendMessageDto("Tentativa não autorizada");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

        assertThrows(ForbiddenException.class, () -> service.sendMessage(1L, dto, 99L));
    }

    @Test
    void sendMessage_givenDraftRequest_shouldThrowInvalidState() {
        ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.DRAFT).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();
        SendMessageDto dto = new SendMessageDto("Mensagem");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));

        assertThrows(InvalidStateException.class, () -> service.sendMessage(1L, dto, 1L));
    }

    @Test
    void getMessages_givenValidParticipant_shouldReturnMessages() {
        when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
        when(chatMessageRepository.findByRequestIdOrderBySentAtAsc(eq(1L), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        var result = service.getMessages(1L, 1L, org.springframework.data.domain.PageRequest.of(0, 50));

        assertNotNull(result);
    }

    @Test
    void sendMessage_givenProviderSender_shouldSucceed() {
        SendMessageDto dto = new SendMessageDto("Amanhã começamos o trabalho.");

        ChatMessage saved = ChatMessage.builder()
                .id(2L).request(awardedRequest).sender(providerUser)
                .content(dto.content()).sentAt(Instant.now()).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(saved);
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(
                Optional.of(providerProfile));

        ChatMessageResponse response = service.sendMessage(1L, dto, 2L);

        assertNotNull(response);
        // Notification should go to client (not provider)
        verify(notificationService).create(eq(1L), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void sendMessage_givenNonExistentRequest_shouldThrowNotFound() {
        SendMessageDto dto = new SendMessageDto("Test");
        when(requestRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.agroconnect.exception.ResourceNotFoundException.class,
                () -> service.sendMessage(999L, dto, 1L));
    }

    @Test
    void getMessages_givenNonParticipant_shouldThrowForbidden() {
        when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

        assertThrows(ForbiddenException.class,
                () -> service.getMessages(1L, 99L, org.springframework.data.domain.PageRequest.of(0, 50)));
    }

    @Test
    void sendMessage_givenCompletedRequest_shouldSucceed() {
        ServiceRequest completedRequest = ServiceRequestFixture.aRequest()
                .status(com.agroconnect.model.enums.RequestStatus.COMPLETED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        SendMessageDto dto = new SendMessageDto("Obrigado pelo serviço.");
        ChatMessage saved = ChatMessage.builder()
                .id(3L).request(completedRequest).sender(clientUser)
                .content(dto.content()).sentAt(Instant.now()).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(saved);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

        ChatMessageResponse response = service.sendMessage(1L, dto, 1L);

        assertNotNull(response);
    }

    @Test
    void sendMessage_givenPublishedRequest_shouldThrowInvalidState() {
        ServiceRequest publishedRequest = ServiceRequestFixture.aRequest()
                .status(com.agroconnect.model.enums.RequestStatus.PUBLISHED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        SendMessageDto dto = new SendMessageDto("Test");
        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));

        assertThrows(InvalidStateException.class, () -> service.sendMessage(1L, dto, 1L));
    }
}
