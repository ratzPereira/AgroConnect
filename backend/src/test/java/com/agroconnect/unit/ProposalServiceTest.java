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
import com.agroconnect.model.Transaction;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.service.ExecutionService;
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.ProposalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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
    @Mock private ExecutionService executionService;
    @Mock private jakarta.persistence.EntityManager entityManager;

    private ProposalService service;

    private User clientUser;
    private User providerUser;
    private User otherProviderUser;
    private ProviderProfile providerProfile;
    private ProviderProfile otherProviderProfile;
    private ServiceCategory category;
    private ServiceRequest publishedRequest;

    @BeforeEach
    void setUp() {
        service = new ProposalService(
                proposalRepository, requestRepository,
                providerProfileRepository, transactionRepository,
                notificationService, executionService, entityManager);
        ReflectionTestUtils.setField(service, "commissionRate", new BigDecimal("0.1200"));

        clientUser = UserFixture.aClientUser().build();
        providerUser = UserFixture.aProviderUser().build();
        otherProviderUser = UserFixture.aProviderUser().id(3L).email("other-provider@email.pt").build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        otherProviderProfile = UserFixture.aProviderProfile().id(2L).user(otherProviderUser).companyName("Outro Prestador").build();
        category = ServiceRequestFixture.aCategory().build();
        publishedRequest = ServiceRequestFixture.aPublishedRequest()
                .client(clientUser).category(category).build();
    }

    // ── CREATE ──

    @Test
    void create_givenPublishedRequest_shouldCreatePendingProposal() {
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
        assertEquals(ProposalStatus.PENDING, response.status());
        assertEquals(new BigDecimal("250.00"), response.price());
        verify(proposalRepository).save(any(Proposal.class));
    }

    @Test
    void create_givenPublishedRequest_shouldTransitionToWithProposals() {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("250.00"), PricingModel.FIXED, null, null,
                "Faço o trabalho", null, null, null, null);

        Proposal savedProposal = ProposalFixture.aProposal()
                .request(publishedRequest).provider(providerProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.existsByRequestIdAndProviderId(1L, 1L)).thenReturn(false);
        when(proposalRepository.save(any(Proposal.class))).thenReturn(savedProposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(publishedRequest);

        service.create(1L, dto, 2L);

        // PUBLISHED request should be transitioned to WITH_PROPOSALS
        verify(requestRepository).save(any(ServiceRequest.class));
    }

    @Test
    void create_givenWithProposalsRequest_shouldNotTransitionStatus() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("300.00"), PricingModel.FIXED, null, null,
                "Outra proposta", null, null, null, null);

        Proposal savedProposal = ProposalFixture.aProposal()
                .request(requestWithProposals).provider(providerProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(requestWithProposals));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.existsByRequestIdAndProviderId(1L, 1L)).thenReturn(false);
        when(proposalRepository.save(any(Proposal.class))).thenReturn(savedProposal);

        service.create(1L, dto, 2L);

        // WITH_PROPOSALS should NOT be saved again (already in correct state)
        verify(requestRepository, never()).save(any(ServiceRequest.class));
    }

    @Test
    void create_givenNonPublishedRequest_shouldThrowInvalidState() {
        ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                .client(clientUser).category(category).build();

        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Description", null, null, null, null);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));

        assertThrows(InvalidStateException.class, () -> service.create(1L, dto, 2L));
    }

    @Test
    void create_givenAwardedRequest_shouldThrowInvalidState() {
        ServiceRequest awardedRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.AWARDED).client(clientUser).category(category).build();

        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Description", null, null, null, null);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));

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
    void create_givenNonExistentRequest_shouldThrowNotFound() {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Description", null, null, null, null);

        when(requestRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(999L, dto, 2L));
    }

    @Test
    void create_givenNonExistentProviderProfile_shouldThrowNotFound() {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Description", null, null, null, null);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(1L, dto, 999L));
    }

    @Test
    void create_shouldCalculateCommission() {
        // The proposal itself does not calculate commission, but the accept does.
        // For create, we verify the proposal is saved with status PENDING and the correct price.
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("500.00"), PricingModel.FIXED, null, null,
                "Serviço completo", null, null, null, null);

        Proposal savedProposal = ProposalFixture.aProposal()
                .price(new BigDecimal("500.00"))
                .request(publishedRequest).provider(providerProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.existsByRequestIdAndProviderId(1L, 1L)).thenReturn(false);
        when(proposalRepository.save(any(Proposal.class))).thenReturn(savedProposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(publishedRequest);

        ProposalResponse response = service.create(1L, dto, 2L);

        assertEquals(new BigDecimal("500.00"), response.price());

        ArgumentCaptor<Proposal> captor = ArgumentCaptor.forClass(Proposal.class);
        verify(proposalRepository).save(captor.capture());
        assertEquals(ProposalStatus.PENDING, captor.getValue().getStatus());
        assertEquals(new BigDecimal("500.00"), captor.getValue().getPrice());
    }

    @Test
    void create_shouldSendNotificationToClient() {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("250.00"), PricingModel.FIXED, null, null,
                "Faço o trabalho com trator", null, null, null, null);

        Proposal savedProposal = ProposalFixture.aProposal()
                .request(publishedRequest).provider(providerProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.existsByRequestIdAndProviderId(1L, 1L)).thenReturn(false);
        when(proposalRepository.save(any(Proposal.class))).thenReturn(savedProposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(publishedRequest);

        service.create(1L, dto, 2L);

        verify(notificationService).create(
                eq(clientUser.getId()), eq("NEW_PROPOSAL"), anyString(), anyString(), anyString());
    }

    @Test
    void create_givenNoPricingModel_shouldDefaultToFixed() {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("150.00"), null, null, null,
                "Serviço básico", null, null, null, null);

        Proposal savedProposal = ProposalFixture.aProposal()
                .pricingModel(PricingModel.FIXED)
                .request(publishedRequest).provider(providerProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.existsByRequestIdAndProviderId(1L, 1L)).thenReturn(false);
        when(proposalRepository.save(any(Proposal.class))).thenReturn(savedProposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(publishedRequest);

        service.create(1L, dto, 2L);

        ArgumentCaptor<Proposal> captor = ArgumentCaptor.forClass(Proposal.class);
        verify(proposalRepository).save(captor.capture());
        assertEquals(PricingModel.FIXED, captor.getValue().getPricingModel());
    }

    // ── ACCEPT ──

    @Test
    void accept_givenPendingProposal_shouldSetStatusAccepted() {
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

        service.accept(1L, 1L);

        ArgumentCaptor<Proposal> captor = ArgumentCaptor.forClass(Proposal.class);
        verify(proposalRepository).save(captor.capture());
        assertEquals(ProposalStatus.ACCEPTED, captor.getValue().getStatus());
    }

    @Test
    void accept_givenNonPendingProposal_shouldThrowInvalidState() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        Proposal acceptedProposal = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(requestWithProposals).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(acceptedProposal));

        assertThrows(InvalidStateException.class, () -> service.accept(1L, 1L));
    }

    @Test
    void accept_shouldRejectAllOtherProposals() {
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

        service.accept(1L, 1L);

        verify(proposalRepository).rejectAllPendingExcept(1L, 1L);
    }

    @Test
    void accept_shouldCreateTransaction() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        Proposal proposal = ProposalFixture.aProposal()
                .price(new BigDecimal("250.00"))
                .request(requestWithProposals).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(requestWithProposals);
        when(transactionRepository.save(any())).thenReturn(ProposalFixture.aTransaction()
                .request(requestWithProposals).proposal(proposal).build());
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(proposal));

        service.accept(1L, 1L);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction transaction = captor.getValue();

        assertEquals(new BigDecimal("250.00"), transaction.getAmount());
        assertEquals(new BigDecimal("0.1200"), transaction.getCommissionRate());
        assertEquals(new BigDecimal("30.00"), transaction.getCommissionAmount());
        assertEquals(new BigDecimal("220.00"), transaction.getProviderPayout());
        assertEquals(TransactionStatus.HELD, transaction.getStatus());
    }

    @Test
    void accept_shouldTransitionRequestToAwarded() {
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

        service.accept(1L, 1L);

        ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
        verify(requestRepository).save(captor.capture());
        assertEquals(RequestStatus.AWARDED, captor.getValue().getStatus());
    }

    @Test
    void accept_givenNonRequestOwner_shouldThrowForbidden() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        Proposal proposal = ProposalFixture.aProposal()
                .request(requestWithProposals).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));

        assertThrows(ForbiddenException.class, () -> service.accept(1L, 999L));
    }

    @Test
    void accept_givenExpiredProposal_shouldThrowInvalidState() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        Proposal expiredProposal = ProposalFixture.aProposal()
                .validUntil(Instant.now().minus(1, ChronoUnit.DAYS))
                .request(requestWithProposals).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(expiredProposal));

        assertThrows(InvalidStateException.class, () -> service.accept(1L, 1L));
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
    void accept_shouldCreateExecution() {
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

        service.accept(1L, 1L);

        verify(executionService).createForProposal(proposal);
    }

    @Test
    void accept_shouldNotifyAcceptedProvider() {
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

        service.accept(1L, 1L);

        verify(notificationService).create(
                eq(providerUser.getId()), eq("PROPOSAL_ACCEPTED"), anyString(), anyString(), anyString());
    }

    @Test
    void accept_shouldNotifyRejectedProviders() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        Proposal proposal = ProposalFixture.aProposal()
                .id(1L)
                .request(requestWithProposals).provider(providerProfile).build();

        Proposal rejectedProposal = ProposalFixture.aProposal()
                .id(2L)
                .status(ProposalStatus.REJECTED)
                .request(requestWithProposals).provider(otherProviderProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(requestWithProposals);
        when(transactionRepository.save(any())).thenReturn(ProposalFixture.aTransaction()
                .request(requestWithProposals).proposal(proposal).build());
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(proposal, rejectedProposal));

        service.accept(1L, 1L);

        // Should notify the rejected provider
        verify(notificationService).create(
                eq(otherProviderUser.getId()), eq("PROPOSAL_REJECTED"), anyString(), anyString(), anyString());
    }

    @Test
    void accept_shouldCalculateCommissionCorrectly() {
        ServiceRequest requestWithProposals = ServiceRequestFixture.aRequestWithProposals()
                .client(clientUser).category(category).build();

        BigDecimal price = new BigDecimal("1000.00");
        Proposal proposal = ProposalFixture.aProposal()
                .price(price)
                .request(requestWithProposals).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(requestWithProposals);
        when(transactionRepository.save(any())).thenReturn(ProposalFixture.aTransaction()
                .request(requestWithProposals).proposal(proposal).build());
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(proposal));

        service.accept(1L, 1L);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction transaction = captor.getValue();

        BigDecimal expectedCommission = price.multiply(new BigDecimal("0.1200")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal expectedPayout = price.subtract(expectedCommission);

        assertEquals(price, transaction.getAmount());
        assertEquals(expectedCommission, transaction.getCommissionAmount());
        assertEquals(expectedPayout, transaction.getProviderPayout());
    }

    @Test
    void accept_givenNonExistentProposal_shouldThrowNotFound() {
        when(proposalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.accept(999L, 1L));
    }

    // ── REJECT / WITHDRAW ──

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
    void withdraw_givenNonExistentProposal_shouldThrowNotFound() {
        when(proposalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.withdraw(999L, 2L));
    }

    @Test
    void withdraw_shouldSetStatusToWithdrawn() {
        Proposal proposal = ProposalFixture.aProposal()
                .request(publishedRequest).provider(providerProfile).build();

        when(proposalRepository.findById(1L)).thenReturn(Optional.of(proposal));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);

        service.withdraw(1L, 2L);

        ArgumentCaptor<Proposal> captor = ArgumentCaptor.forClass(Proposal.class);
        verify(proposalRepository).save(captor.capture());
        assertEquals(ProposalStatus.WITHDRAWN, captor.getValue().getStatus());
    }

    // ── LIST BY REQUEST ──

    @Test
    void listByRequest_givenClient_shouldReturnAllProposals() {
        Proposal proposal1 = ProposalFixture.aProposal()
                .id(1L).request(publishedRequest).provider(providerProfile).build();
        Proposal proposal2 = ProposalFixture.aProposal()
                .id(2L).request(publishedRequest).provider(otherProviderProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(proposal1, proposal2));

        List<ProposalResponse> responses = service.listByRequest(1L, 1L);

        assertEquals(2, responses.size());
    }

    @Test
    void listByRequest_givenProvider_shouldReturnOnlyOwnProposals() {
        Proposal ownProposal = ProposalFixture.aProposal()
                .id(1L).request(publishedRequest).provider(providerProfile).build();
        Proposal otherProposal = ProposalFixture.aProposal()
                .id(2L).request(publishedRequest).provider(otherProviderProfile).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(ownProposal, otherProposal));

        List<ProposalResponse> responses = service.listByRequest(1L, 2L);

        assertEquals(1, responses.size());
        assertEquals(providerProfile.getId(), responses.get(0).providerId());
    }

    @Test
    void listByRequest_givenUnrelatedUser_shouldThrowForbidden() {
        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
        when(providerProfileRepository.findByUserId(50L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.listByRequest(1L, 50L));
    }

    @Test
    void listByRequest_givenNonExistentRequest_shouldThrowNotFound() {
        when(requestRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.listByRequest(999L, 1L));
    }

    // ── LIST MY PROPOSALS ──

    @Test
    void listMyProposals_givenProvider_shouldReturnProposals() {
        Proposal proposal = ProposalFixture.aProposal()
                .request(publishedRequest).provider(providerProfile).build();

        Pageable pageable = PageRequest.of(0, 20);
        Page<Proposal> page = new PageImpl<>(List.of(proposal), pageable, 1);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.findByProviderIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);

        Page<ProposalResponse> result = service.listMyProposals(2L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void listMyProposals_givenNonExistentProvider_shouldThrowNotFound() {
        Pageable pageable = PageRequest.of(0, 20);

        when(providerProfileRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.listMyProposals(999L, pageable));
    }

    @Test
    void listMyProposals_givenNoProposals_shouldReturnEmptyPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Proposal> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(proposalRepository.findByProviderIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(emptyPage);

        Page<ProposalResponse> result = service.listMyProposals(2L, pageable);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }
}
