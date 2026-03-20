package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.response.ProposalResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.ProposalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProposalServiceTest {

    @Mock private ProposalRepository proposalRepository;
    @Mock private ServiceRequestRepository requestRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private NotificationService notificationService;

    private ProposalService service;

    private User clientUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private ServiceCategory category;
    private ServiceRequest publishedRequest;

    @BeforeEach
    void setUp() {
        service = new ProposalService(
                proposalRepository, requestRepository,
                providerProfileRepository, transactionRepository,
                notificationService);

        clientUser = UserFixture.aClientUser().build();
        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        category = ServiceRequestFixture.aCategory().build();
        publishedRequest = ServiceRequestFixture.aPublishedRequest()
                .client(clientUser).category(category).build();
    }

    @Test
    void create_givenPublishedRequest_shouldCreateProposalAndTransitionStatus() {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("250.00"), PricingModel.FIXED, null, null,
                "Faço o trabalho com trator", "Combustível incluído", null, null, null);

        Proposal savedProposal = ProposalFixture.aProposal()
                .request(publishedRequest).provider(providerProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.existsByRequestIdAndProviderId(1L, 1L)).thenReturn(false);
        when(proposalRepository.save(any(Proposal.class))).thenReturn(savedProposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(publishedRequest);

        ProposalResponse response = service.create(1L, dto, 2L);

        assertNotNull(response);
        assertEquals(new BigDecimal("250.00"), response.price());
        verify(requestRepository).save(any(ServiceRequest.class));
        verify(notificationService).create(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void create_givenDraftRequest_shouldThrowInvalidState() {
        ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                .client(clientUser).category(category).build();

        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Description", null, null, null, null);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));

        assertThrows(InvalidStateException.class, () -> service.create(1L, dto, 2L));
    }

    @Test
    void create_givenDuplicateProposal_shouldThrowInvalidState() {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Description", null, null, null, null);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.existsByRequestIdAndProviderId(1L, 1L)).thenReturn(true);

        assertThrows(InvalidStateException.class, () -> service.create(1L, dto, 2L));
    }

    @Test
    void accept_givenValidProposal_shouldAcceptAndRejectOthers() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        Proposal proposal = ProposalFixture.aProposal()
                .request(requestWithProposals).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(requestWithProposals);
        when(transactionRepository.save(any())).thenReturn(ProposalFixture.aTransaction()
                .request(requestWithProposals).proposal(proposal).build());
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(proposal));

        ProposalResponse response = service.accept(1L, 1L);

        assertNotNull(response);
        verify(proposalRepository).rejectAllPendingExcept(1L, 1L);
        verify(transactionRepository).save(any());
    }

    @Test
    void accept_givenNonOwner_shouldThrowForbidden() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        Proposal proposal = ProposalFixture.aProposal()
                .request(requestWithProposals).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));

        assertThrows(ForbiddenException.class, () -> service.accept(1L, 999L));
    }

    @Test
    void accept_givenWrongRequestStatus_shouldThrowInvalidState() {
        ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                .client(clientUser).category(category).build();

        Proposal proposal = ProposalFixture.aProposal()
                .request(draftRequest).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));

        assertThrows(InvalidStateException.class, () -> service.accept(1L, 1L));
    }

    @Test
    void withdraw_givenPendingProposal_shouldSetWithdrawn() {
        Proposal proposal = ProposalFixture.aProposal()
                .request(publishedRequest).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);

        ProposalResponse response = service.withdraw(1L, 2L);

        assertNotNull(response);
        verify(proposalRepository).save(any(Proposal.class));
    }

    @Test
    void withdraw_givenNonPendingProposal_shouldThrowInvalidState() {
        Proposal accepted = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(publishedRequest).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(accepted));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        assertThrows(InvalidStateException.class, () -> service.withdraw(1L, 2L));
    }

    @Test
    void withdraw_givenDifferentProvider_shouldThrowForbidden() {
        ProviderProfile otherProvider = UserFixture.aProviderProfile().id(99L).build();
        Proposal proposal = ProposalFixture.aProposal()
                .request(publishedRequest).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(otherProvider));

        assertThrows(ForbiddenException.class, () -> service.withdraw(1L, 2L));
    }

    @Test
    void listByRequest_givenNonExistentRequest_shouldThrowNotFound() {
        when(requestRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.listByRequest(999L, 1L));
    }
}
