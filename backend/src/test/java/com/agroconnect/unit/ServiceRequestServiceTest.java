package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.DisputeRequestDto;
import com.agroconnect.dto.request.ResolveDisputeDto;
import com.agroconnect.dto.request.UpdateServiceRequestDto;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.dto.response.ServiceRequestResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.RequestPhoto;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.RequestPhotoRepository;
import com.agroconnect.repository.ServiceCategoryRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.AuditService;
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.ServiceRequestService;
import com.agroconnect.service.TransactionService;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceRequestServiceTest {

    @Mock private ServiceRequestRepository requestRepository;
    @Mock private ServiceCategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private RequestPhotoRepository photoRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private TransactionService transactionService;
    @Mock private NotificationService notificationService;
    @Mock private ServiceExecutionRepository executionRepository;
    @Mock private ExecutionAssignmentRepository assignmentRepository;
    @Mock private AuditService auditService;
    @Mock private MinioClient minioClient;

    private ServiceRequestService service;

    private User clientUser;
    private User otherUser;
    private ClientProfile clientProfile;
    private ServiceCategory category;

    @BeforeEach
    void setUp() {
        service = new ServiceRequestService(
                requestRepository, categoryRepository, userRepository,
                clientProfileRepository, providerProfileRepository,
                photoRepository, proposalRepository, transactionRepository,
                transactionService, notificationService,
                executionRepository, assignmentRepository, auditService, minioClient);

        // Set @Value fields that would normally be injected by Spring
        ReflectionTestUtils.setField(service, "minioBucket", "agroconnect");
        ReflectionTestUtils.setField(service, "minioEndpoint", "http://minio:9000");
        ReflectionTestUtils.setField(service, "minioPublicEndpoint", "http://localhost:9000");

        clientUser = UserFixture.aClientUser().build();
        otherUser = UserFixture.aClientUser().id(999L).email("other@email.pt").build();
        clientProfile = UserFixture.aClientProfile().user(clientUser).build();
        category = ServiceRequestFixture.aCategory().build();
    }

    // ========================================================================
    // CRUD Tests
    // ========================================================================

    @Nested
    class CreateTests {

        @Test
        void create_givenValidDto_shouldCreateDraftRequest() {
            CreateServiceRequestDto dto = new CreateServiceRequestDto(
                    1L, "Lavoura", "Preciso de lavoura",
                    38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                    2.0, "hectares", Urgency.MEDIUM, null, null, null);

            ServiceRequest savedRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(savedRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

            ServiceRequestResponse response = service.create(dto, 1L);

            assertNotNull(response);
            assertEquals(RequestStatus.DRAFT, response.status());
            verify(requestRepository).save(any(ServiceRequest.class));
        }

        @Test
        void create_shouldSetClientFromUserId() {
            CreateServiceRequestDto dto = new CreateServiceRequestDto(
                    1L, "Test Title", "Test description",
                    38.6667, -27.2167, null, "Angra do Heroísmo", "Terceira",
                    null, null, null, null, null, null);

            ServiceRequest savedRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(savedRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

            service.create(dto, 1L);

            ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
            verify(requestRepository).save(captor.capture());
            assertEquals(clientUser, captor.getValue().getClient());
        }

        @Test
        void create_givenInvalidCategory_shouldThrowNotFound() {
            CreateServiceRequestDto dto = new CreateServiceRequestDto(
                    999L, "Test", "Test description",
                    38.6667, -27.2167, null, "Angra do Heroísmo", "Terceira",
                    null, null, null, null, null, null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
            when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.create(dto, 1L));
        }

        @Test
        void create_givenInvalidUser_shouldThrowNotFound() {
            CreateServiceRequestDto dto = new CreateServiceRequestDto(
                    1L, "Test", "Test description",
                    38.6667, -27.2167, null, "Angra do Heroísmo", "Terceira",
                    null, null, null, null, null, null);

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.create(dto, 999L));
        }

        @Test
        void create_givenNullUrgency_shouldDefaultToMedium() {
            CreateServiceRequestDto dto = new CreateServiceRequestDto(
                    1L, "Test", "Test description",
                    38.6667, -27.2167, null, "Angra do Heroísmo", "Terceira",
                    2.0, null, null, null, null, null);

            ServiceRequest savedRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(savedRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

            service.create(dto, 1L);

            ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
            verify(requestRepository).save(captor.capture());
            assertEquals(Urgency.MEDIUM, captor.getValue().getUrgency());
        }
    }

    @Nested
    class GetByIdTests {

        @Test
        void getById_givenExistingId_shouldReturnResponse() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            ServiceRequestResponse response = service.getById(1L, 1L);

            assertNotNull(response);
            assertEquals(1L, response.id());
        }

        @Test
        void getById_givenNonExistingId_shouldThrowNotFound() {
            when(requestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.getById(999L, 1L));
        }

        @Test
        void getById_givenDraftAndOwner_shouldReturnResponse() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            ServiceRequestResponse response = service.getById(1L, 1L);

            assertNotNull(response);
            assertEquals(RequestStatus.DRAFT, response.status());
        }

        @Test
        void getById_givenDraftAndNonOwner_shouldThrowForbidden() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));

            assertThrows(ForbiddenException.class, () -> service.getById(1L, 999L));
        }

        @Test
        void getById_givenPublishedAndNonOwner_shouldReturnResponse() {
            ServiceRequest publishedRequest = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            // Non-owner (userId=999) can view published requests
            ServiceRequestResponse response = service.getById(1L, 999L);

            assertNotNull(response);
        }
    }

    @Nested
    class UpdateTests {

        @Test
        void update_givenDraftRequest_shouldUpdateFields() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            UpdateServiceRequestDto dto = new UpdateServiceRequestDto(
                    null, "New Title", "New Description",
                    null, null, null, null, null,
                    3.0, null, Urgency.HIGH, null, null, null);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(draftRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            ServiceRequestResponse response = service.update(1L, dto, 1L);

            assertNotNull(response);
            verify(requestRepository).save(any(ServiceRequest.class));
        }

        @Test
        void update_givenNonDraftRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.update(1L, null, 1L));
        }

        @Test
        void update_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            UpdateServiceRequestDto dto = new UpdateServiceRequestDto(
                    null, "New Title", null,
                    null, null, null, null, null,
                    null, null, null, null, null, null);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class, () -> service.update(1L, dto, 999L));
        }

        @Test
        void update_givenNewCategory_shouldUpdateCategory() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            ServiceCategory newCategory = ServiceRequestFixture.aCategory()
                    .id(2L).name("Pulverização").slug("pulverizacao").build();

            UpdateServiceRequestDto dto = new UpdateServiceRequestDto(
                    2L, null, null,
                    null, null, null, null, null,
                    null, null, null, null, null, null);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
            when(categoryRepository.findById(2L)).thenReturn(Optional.of(newCategory));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(draftRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            service.update(1L, dto, 1L);

            assertEquals(newCategory, draftRequest.getCategory());
        }
    }

    // ========================================================================
    // State Machine — Publish
    // ========================================================================

    @Nested
    class PublishTests {

        @Test
        void publish_givenDraftRequest_shouldSetStatusPublished() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(draftRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

            ServiceRequestResponse response = service.publish(1L, 1L);

            assertNotNull(response);
            assertEquals(RequestStatus.PUBLISHED, draftRequest.getStatus());
            assertNotNull(draftRequest.getExpiresAt());
            verify(requestRepository).save(any(ServiceRequest.class));
        }

        @Test
        void publish_givenDraftRequest_shouldSetExpirationDate() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(draftRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

            Instant before = Instant.now().plus(29, ChronoUnit.DAYS);
            service.publish(1L, 1L);
            Instant after = Instant.now().plus(31, ChronoUnit.DAYS);

            assertTrue(draftRequest.getExpiresAt().isAfter(before));
            assertTrue(draftRequest.getExpiresAt().isBefore(after));
        }

        @Test
        void publish_givenNonDraftRequest_shouldThrowInvalidState() {
            ServiceRequest publishedRequest = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));

            assertThrows(InvalidStateException.class, () -> service.publish(1L, 1L));
        }

        @Test
        void publish_givenAwardedRequest_shouldThrowInvalidState() {
            ServiceRequest awardedRequest = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWARDED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));

            assertThrows(InvalidStateException.class, () -> service.publish(1L, 1L));
        }

        @Test
        void publish_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class, () -> service.publish(1L, 999L));
        }

        @Test
        void publish_shouldCallAuditService() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(draftRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

            service.publish(1L, 1L);

            verify(auditService).log(eq(1L), eq("PUBLISHED"), eq("ServiceRequest"), eq(1L), any(), any());
        }
    }

    // ========================================================================
    // State Machine — Cancel
    // ========================================================================

    @Nested
    class CancelTests {

        @Test
        void cancel_givenPublishedRequest_shouldSetStatusCancelled() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

            ServiceRequestResponse response = service.cancel(1L, 1L);

            assertNotNull(response);
            assertEquals(RequestStatus.CANCELLED, request.getStatus());
            verify(requestRepository).save(any(ServiceRequest.class));
        }

        @Test
        void cancel_givenDraftRequest_shouldSetStatusCancelled() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

            service.cancel(1L, 1L);

            assertEquals(RequestStatus.CANCELLED, request.getStatus());
        }

        @Test
        void cancel_givenAwardedRequest_shouldRefundAndCancel() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWARDED)
                    .client(clientUser).category(category).build();

            Transaction heldTransaction = Transaction.builder()
                    .id(1L).request(request)
                    .amount(BigDecimal.valueOf(500))
                    .status(TransactionStatus.HELD)
                    .build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));

            service.cancel(1L, 1L);

            assertEquals(RequestStatus.CANCELLED, request.getStatus());
            verify(transactionService).refund(1L);
        }

        @Test
        void cancel_givenInProgressRequest_shouldCancel() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.IN_PROGRESS)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

            service.cancel(1L, 1L);

            assertEquals(RequestStatus.CANCELLED, request.getStatus());
        }

        @Test
        void cancel_givenAwaitingConfirmationRequest_shouldCancel() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

            service.cancel(1L, 1L);

            assertEquals(RequestStatus.CANCELLED, request.getStatus());
        }

        @Test
        void cancel_givenCompletedRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.COMPLETED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.cancel(1L, 1L));
        }

        @Test
        void cancel_givenRatedRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.RATED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.cancel(1L, 1L));
        }

        @Test
        void cancel_givenCancelledRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.CANCELLED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.cancel(1L, 1L));
        }

        @Test
        void cancel_givenExpiredRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.EXPIRED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.cancel(1L, 1L));
        }

        @Test
        void cancel_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class, () -> service.cancel(1L, 999L));
        }

        @Test
        void cancel_givenNoHeldTransaction_shouldNotRefund() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

            service.cancel(1L, 1L);

            verify(transactionService, never()).refund(anyLong());
        }

        @Test
        void cancel_givenReleasedTransaction_shouldNotRefund() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            Transaction releasedTx = Transaction.builder()
                    .id(1L).request(request)
                    .amount(BigDecimal.valueOf(500))
                    .status(TransactionStatus.RELEASED)
                    .build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(releasedTx));

            service.cancel(1L, 1L);

            verify(transactionService, never()).refund(anyLong());
        }

        @Test
        void cancel_shouldCallAuditService() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

            service.cancel(1L, 1L);

            verify(auditService).log(eq(1L), eq("CANCELLED"), eq("ServiceRequest"), eq(1L), any(), any());
        }
    }

    // ========================================================================
    // State Machine — Confirm
    // ========================================================================

    @Nested
    class ConfirmTests {

        private Proposal createAcceptedProposal(ServiceRequest request) {
            User providerUser = UserFixture.aProviderUser().build();
            ProviderProfile provider = UserFixture.aProviderProfile().user(providerUser).build();
            return Proposal.builder()
                    .id(1L)
                    .request(request)
                    .provider(provider)
                    .status(ProposalStatus.ACCEPTED)
                    .price(BigDecimal.valueOf(200))
                    .description("Service proposal")
                    .build();
        }

        @Test
        void confirm_givenAwaitingConfirmation_shouldSetStatusCompleted() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            ServiceRequestResponse response = service.confirm(1L, 1L);

            assertNotNull(response);
            assertEquals(RequestStatus.COMPLETED, request.getStatus());
            verify(transactionService).release(1L);
        }

        @Test
        void confirm_givenAwaitingConfirmation_shouldReleaseFunds() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            service.confirm(1L, 1L);

            verify(transactionService).release(1L);
        }

        @Test
        void confirm_givenAwaitingConfirmation_shouldNotifyProvider() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            service.confirm(1L, 1L);

            verify(notificationService).create(
                    eq(acceptedProposal.getProvider().getUser().getId()),
                    eq("SERVICE_CONFIRMED"),
                    anyString(), anyString(), anyString());
        }

        @Test
        void confirm_givenNonAwaitingRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.confirm(1L, 1L));
        }

        @Test
        void confirm_givenDraftRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.confirm(1L, 1L));
        }

        @Test
        void confirm_givenCompletedRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.COMPLETED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.confirm(1L, 1L));
        }

        @Test
        void confirm_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class, () -> service.confirm(1L, 999L));
        }
    }

    // ========================================================================
    // State Machine — Dispute
    // ========================================================================

    @Nested
    class DisputeTests {

        private Proposal createAcceptedProposal(ServiceRequest request) {
            User providerUser = UserFixture.aProviderUser().build();
            ProviderProfile provider = UserFixture.aProviderProfile().user(providerUser).build();
            return Proposal.builder()
                    .id(1L)
                    .request(request)
                    .provider(provider)
                    .status(ProposalStatus.ACCEPTED)
                    .price(BigDecimal.valueOf(200))
                    .description("Service proposal")
                    .build();
        }

        @Test
        void dispute_givenAwaitingConfirmation_shouldSetStatusDisputed() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            DisputeRequestDto dto = new DisputeRequestDto("O trabalho não foi realizado corretamente");
            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            ServiceRequestResponse response = service.dispute(1L, dto, 1L);

            assertNotNull(response);
            assertEquals(RequestStatus.DISPUTED, request.getStatus());
        }

        @Test
        void dispute_shouldPersistDisputeReason() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            String reason = "O terreno não foi todo lavrado como combinado";
            DisputeRequestDto dto = new DisputeRequestDto(reason);
            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            service.dispute(1L, dto, 1L);

            assertEquals(reason, request.getDisputeReason());
        }

        @Test
        void dispute_givenNonAwaitingRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            DisputeRequestDto dto = new DisputeRequestDto("Some reason for dispute");

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.dispute(1L, dto, 1L));
        }

        @Test
        void dispute_givenCompletedRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.COMPLETED)
                    .client(clientUser).category(category).build();

            DisputeRequestDto dto = new DisputeRequestDto("Some reason for dispute");

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.dispute(1L, dto, 1L));
        }

        @Test
        void dispute_givenInProgressRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.IN_PROGRESS)
                    .client(clientUser).category(category).build();

            DisputeRequestDto dto = new DisputeRequestDto("Some reason for dispute");

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.dispute(1L, dto, 1L));
        }

        @Test
        void dispute_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            DisputeRequestDto dto = new DisputeRequestDto("Some reason for dispute");

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class, () -> service.dispute(1L, dto, 999L));
        }

        @Test
        void dispute_shouldNotifyProvider() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWAITING_CONFIRMATION)
                    .client(clientUser).category(category).build();

            DisputeRequestDto dto = new DisputeRequestDto("O trabalho não foi realizado corretamente");
            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            service.dispute(1L, dto, 1L);

            verify(notificationService).create(
                    eq(acceptedProposal.getProvider().getUser().getId()),
                    eq("SERVICE_DISPUTED"),
                    anyString(), anyString(), anyString());
        }
    }

    // ========================================================================
    // State Machine — Resolve Dispute
    // ========================================================================

    @Nested
    class ResolveDisputeTests {

        private Proposal createAcceptedProposal(ServiceRequest request) {
            User providerUser = UserFixture.aProviderUser().build();
            ProviderProfile provider = UserFixture.aProviderProfile().user(providerUser).build();
            return Proposal.builder()
                    .id(1L)
                    .request(request)
                    .provider(provider)
                    .status(ProposalStatus.ACCEPTED)
                    .price(BigDecimal.valueOf(200))
                    .description("Service proposal")
                    .build();
        }

        @Test
        void resolveDispute_givenReleaseResolution_shouldSetCompleted() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.DISPUTED)
                    .client(clientUser).category(category).build();

            ResolveDisputeDto dto = new ResolveDisputeDto(
                    ResolveDisputeDto.Resolution.RELEASE, "Provider did the work");

            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            service.resolveDispute(1L, dto);

            assertEquals(RequestStatus.COMPLETED, request.getStatus());
            verify(transactionService).release(1L);
        }

        @Test
        void resolveDispute_givenRefundResolution_shouldSetCancelled() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.DISPUTED)
                    .client(clientUser).category(category).build();

            ResolveDisputeDto dto = new ResolveDisputeDto(
                    ResolveDisputeDto.Resolution.REFUND, "Provider did not complete the work");

            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            service.resolveDispute(1L, dto);

            assertEquals(RequestStatus.CANCELLED, request.getStatus());
            verify(transactionService).refund(1L);
        }

        @Test
        void resolveDispute_givenNonDisputedRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            ResolveDisputeDto dto = new ResolveDisputeDto(
                    ResolveDisputeDto.Resolution.RELEASE, "Notes");

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.resolveDispute(1L, dto));
        }

        @Test
        void resolveDispute_givenRelease_shouldNotifyBothParties() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.DISPUTED)
                    .client(clientUser).category(category).build();

            ResolveDisputeDto dto = new ResolveDisputeDto(
                    ResolveDisputeDto.Resolution.RELEASE, "Work verified");

            Proposal acceptedProposal = createAcceptedProposal(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            service.resolveDispute(1L, dto);

            // Should notify both client and provider
            verify(notificationService).create(
                    eq(clientUser.getId()), eq("DISPUTE_RESOLVED"),
                    anyString(), anyString(), anyString());
            verify(notificationService).create(
                    eq(acceptedProposal.getProvider().getUser().getId()), eq("DISPUTE_RESOLVED"),
                    anyString(), anyString(), anyString());
        }
    }

    // ========================================================================
    // Photo Upload Tests
    // ========================================================================

    @Nested
    class PhotoUploadTests {

        @Test
        void generateUploadUrl_givenDraftRequest_shouldReturnUrl() throws Exception {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("http://minio:9000/agroconnect/requests/1/test.jpg");

            PresignedUrlResponse response = service.generateUploadUrl(1L, 1L);

            assertNotNull(response);
        }

        @Test
        void generateUploadUrl_givenPublishedRequest_shouldReturnUrl() throws Exception {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("http://minio:9000/agroconnect/requests/1/test.jpg");

            PresignedUrlResponse response = service.generateUploadUrl(1L, 1L);

            assertNotNull(response);
        }

        @Test
        void generateUploadUrl_givenCompletedRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.COMPLETED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.generateUploadUrl(1L, 1L));
        }

        @Test
        void generateUploadUrl_givenAwardedRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWARDED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.generateUploadUrl(1L, 1L));
        }

        @Test
        void generateUploadUrl_givenInProgressRequest_shouldThrowInvalidState() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.IN_PROGRESS)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.generateUploadUrl(1L, 1L));
        }

        @Test
        void generateUploadUrl_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class, () -> service.generateUploadUrl(1L, 999L));
        }

        @Test
        void generateUploadUrl_givenMaxPhotosReached_shouldThrowValidation() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(10);

            assertThrows(ValidationException.class, () -> service.generateUploadUrl(1L, 1L));
        }

        @Test
        void generateUploadUrl_givenPngContentType_shouldUsePngExtension() throws Exception {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("http://minio:9000/agroconnect/requests/1/test.png");

            PresignedUrlResponse response = service.generateUploadUrl(1L, 1L, "image/png");

            assertNotNull(response);
            // The object key in the URL should use .png extension
            assertNotNull(response.objectKey());
            assertTrue(response.objectKey().endsWith(".png"));
        }

        @Test
        void generateUploadUrl_givenWebpContentType_shouldUseWebpExtension() throws Exception {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("http://minio:9000/agroconnect/requests/1/test.webp");

            PresignedUrlResponse response = service.generateUploadUrl(1L, 1L, "image/webp");

            assertNotNull(response);
            assertTrue(response.objectKey().endsWith(".webp"));
        }

        @Test
        void generateUploadUrl_givenJpegContentType_shouldUseJpgExtension() throws Exception {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("http://minio:9000/agroconnect/requests/1/test.jpg");

            PresignedUrlResponse response = service.generateUploadUrl(1L, 1L, "image/jpeg");

            assertNotNull(response);
            assertTrue(response.objectKey().endsWith(".jpg"));
        }

        @Test
        void confirmPhotoUpload_givenValidUrl_shouldAddPhoto() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).photos(new ArrayList<>()).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(photoRepository.save(any(RequestPhoto.class))).thenReturn(
                    ServiceRequestFixture.aPhoto().request(request).build());
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            String photoUrl = "http://minio:9000/agroconnect/requests/1/photo1.jpg";
            ServiceRequestResponse response = service.confirmPhotoUpload(1L, photoUrl, 1L);

            assertNotNull(response);
            verify(photoRepository).save(any(RequestPhoto.class));
        }

        @Test
        void confirmPhotoUpload_givenDuplicateUrl_shouldReturnIdempotent() {
            RequestPhoto existingPhoto = ServiceRequestFixture.aPhoto().build();
            String photoUrl = existingPhoto.getPhotoUrl();

            List<RequestPhoto> photos = new ArrayList<>();
            photos.add(existingPhoto);

            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).photos(photos).build();
            existingPhoto.setRequest(request);

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            ServiceRequestResponse response = service.confirmPhotoUpload(1L, photoUrl, 1L);

            assertNotNull(response);
            // Should NOT save a new photo — idempotent
            verify(photoRepository, never()).save(any(RequestPhoto.class));
        }

        @Test
        void confirmPhotoUpload_givenCompletedRequest_shouldThrow() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.COMPLETED)
                    .client(clientUser).category(category).photos(new ArrayList<>()).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class,
                    () -> service.confirmPhotoUpload(1L, "http://some-url/photo.jpg", 1L));
        }

        @Test
        void confirmPhotoUpload_givenAwardedRequest_shouldThrow() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.AWARDED)
                    .client(clientUser).category(category).photos(new ArrayList<>()).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class,
                    () -> service.confirmPhotoUpload(1L, "http://some-url/photo.jpg", 1L));
        }

        @Test
        void confirmPhotoUpload_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).photos(new ArrayList<>()).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class,
                    () -> service.confirmPhotoUpload(1L, "http://some-url/photo.jpg", 999L));
        }
    }

    // ========================================================================
    // Delete Photo Tests
    // ========================================================================

    @Nested
    class DeletePhotoTests {

        @Test
        void deletePhoto_givenValidPhoto_shouldDelete() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            RequestPhoto photo = ServiceRequestFixture.aPhoto()
                    .id(10L).request(request).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.findById(10L)).thenReturn(Optional.of(photo));

            service.deletePhoto(1L, 10L, 1L);

            verify(photoRepository).delete(photo);
        }

        @Test
        void deletePhoto_givenNonOwner_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(ForbiddenException.class, () -> service.deletePhoto(1L, 10L, 999L));
        }

        @Test
        void deletePhoto_givenPhotoNotFound_shouldThrowNotFound() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.deletePhoto(1L, 999L, 1L));
        }

        @Test
        void deletePhoto_givenPhotoFromDifferentRequest_shouldThrowForbidden() {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            ServiceRequest otherRequest = ServiceRequestFixture.aRequest()
                    .id(2L).client(clientUser).category(category).build();

            RequestPhoto photo = ServiceRequestFixture.aPhoto()
                    .id(10L).request(otherRequest).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.findById(10L)).thenReturn(Optional.of(photo));

            assertThrows(ForbiddenException.class, () -> service.deletePhoto(1L, 10L, 1L));
        }
    }

    // ========================================================================
    // Edge cases & additional coverage
    // ========================================================================

    @Nested
    class EdgeCaseTests {

        @Test
        void getById_givenNonExistentRequest_shouldThrowNotFound() {
            when(requestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.getById(999L, 1L));
        }

        @Test
        void publish_givenNonExistentRequest_shouldThrowNotFound() {
            when(requestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.publish(999L, 1L));
        }

        @Test
        void cancel_givenNonExistentRequest_shouldThrowNotFound() {
            when(requestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.cancel(999L, 1L));
        }

        @Test
        void confirm_givenNonExistentRequest_shouldThrowNotFound() {
            when(requestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.confirm(999L, 1L));
        }

        @Test
        void dispute_givenNonExistentRequest_shouldThrowNotFound() {
            DisputeRequestDto dto = new DisputeRequestDto("Some dispute reason");

            when(requestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.dispute(999L, dto, 1L));
        }

        @Test
        void cancel_givenWithProposalsRequest_shouldCancel() {
            ServiceRequest request = ServiceRequestFixture.aRequestWithProposals()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
            when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

            service.cancel(1L, 1L);

            assertEquals(RequestStatus.CANCELLED, request.getStatus());
        }

        @Test
        void cancel_givenDisputedRequest_shouldThrowInvalidState() {
            // DISPUTED is not in the CANCELLABLE_STATES set — only admin can resolve disputes
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.DISPUTED)
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

            assertThrows(InvalidStateException.class, () -> service.cancel(1L, 1L));
        }
    }

    // ========================================================================
    // List / Search Methods
    // ========================================================================

    @Nested
    class ListTests {

        @Test
        void listMyRequests_givenStatusFilter_shouldFilterByStatus() {
            org.springframework.data.domain.Page<ServiceRequest> page = org.springframework.data.domain.Page.empty();
            when(requestRepository.findByClientIdAndStatusOrderByCreatedAtDesc(eq(1L), eq(RequestStatus.PUBLISHED), any()))
                    .thenReturn(page);

            var result = service.listMyRequests(1L, RequestStatus.PUBLISHED,
                    org.springframework.data.domain.PageRequest.of(0, 20));

            assertNotNull(result);
            verify(requestRepository).findByClientIdAndStatusOrderByCreatedAtDesc(eq(1L), eq(RequestStatus.PUBLISHED), any());
        }

        @Test
        void listMyRequests_givenNullStatus_shouldReturnAll() {
            org.springframework.data.domain.Page<ServiceRequest> page = org.springframework.data.domain.Page.empty();
            when(requestRepository.findByClientIdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(page);

            var result = service.listMyRequests(1L, null,
                    org.springframework.data.domain.PageRequest.of(0, 20));

            assertNotNull(result);
            verify(requestRepository).findByClientIdOrderByCreatedAtDesc(eq(1L), any());
        }

        @Test
        void listAvailableForProvider_givenValidProvider_shouldReturnResults() {
            ProviderProfile provider = UserFixture.aProviderProfile()
                    .location(ServiceRequestFixture.createPoint(-27.2, 38.6))
                    .serviceRadiusKm(25).build();

            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(provider));
            when(requestRepository.findAvailableForProvider(any(), eq(25000.0), any()))
                    .thenReturn(org.springframework.data.domain.Page.empty());

            var result = service.listAvailableForProvider(2L,
                    org.springframework.data.domain.PageRequest.of(0, 20));

            assertNotNull(result);
        }

        @Test
        void listAvailableForProvider_givenNoLocation_shouldThrowValidation() {
            ProviderProfile provider = UserFixture.aProviderProfile()
                    .location(null).build();

            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(provider));

            assertThrows(ValidationException.class,
                    () -> service.listAvailableForProvider(2L,
                            org.springframework.data.domain.PageRequest.of(0, 20)));
        }

        @Test
        void listAvailableForProvider_givenNoProfile_shouldThrowNotFound() {
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> service.listAvailableForProvider(99L,
                            org.springframework.data.domain.PageRequest.of(0, 20)));
        }

        @Test
        void listAvailableForProviderFiltered_givenFilters_shouldPassToRepo() {
            ProviderProfile provider = UserFixture.aProviderProfile()
                    .location(ServiceRequestFixture.createPoint(-27.2, 38.6))
                    .serviceRadiusKm(25).build();

            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(provider));
            when(requestRepository.findAvailableForProviderFiltered(any(), eq(25000.0),
                    eq("lavoura"), eq(1L), eq("HIGH"), eq("Terceira"), any()))
                    .thenReturn(org.springframework.data.domain.Page.empty());

            var result = service.listAvailableForProviderFiltered(2L,
                    "lavoura", 1L, "HIGH", "Terceira",
                    org.springframework.data.domain.PageRequest.of(0, 20));

            assertNotNull(result);
        }

        @Test
        void listAvailableForProviderFiltered_givenBlankSearch_shouldPassNull() {
            ProviderProfile provider = UserFixture.aProviderProfile()
                    .location(ServiceRequestFixture.createPoint(-27.2, 38.6))
                    .serviceRadiusKm(25).build();

            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(provider));
            when(requestRepository.findAvailableForProviderFiltered(any(), eq(25000.0),
                    eq(null), eq(null), eq(null), eq(null), any()))
                    .thenReturn(org.springframework.data.domain.Page.empty());

            service.listAvailableForProviderFiltered(2L,
                    "  ", null, null, null,
                    org.springframework.data.domain.PageRequest.of(0, 20));

            verify(requestRepository).findAvailableForProviderFiltered(any(), eq(25000.0),
                    eq(null), eq(null), eq(null), eq(null), any());
        }

        @Test
        void getPinsForProvider_givenValidProvider_shouldReturnPins() {
            ProviderProfile provider = UserFixture.aProviderProfile()
                    .location(ServiceRequestFixture.createPoint(-27.2, 38.6))
                    .serviceRadiusKm(25).build();

            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(provider));
            when(requestRepository.findPinsForProvider(any(), eq(25000.0)))
                    .thenReturn(List.of(request));

            var result = service.getPinsForProvider(2L);

            assertEquals(1, result.size());
            assertEquals("Lavoura de 2 hectares", result.get(0).title());
        }

        @Test
        void getPinsForProvider_givenNoLocation_shouldReturnEmpty() {
            ProviderProfile provider = UserFixture.aProviderProfile()
                    .location(null).build();

            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(provider));

            var result = service.getPinsForProvider(2L);

            assertTrue(result.isEmpty());
        }

        @Test
        void getPinsForClient_shouldReturnNonTerminalPins() {
            ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findByClientIdAndStatusNotIn(eq(1L), any()))
                    .thenReturn(List.of(request));

            var result = service.getPinsForClient(1L);

            assertEquals(1, result.size());
        }

        @Test
        void getActiveJobsForProvider_shouldReturnActiveJobs() {
            ProviderProfile provider = UserFixture.aProviderProfile().build();
            User pvUser = UserFixture.aProviderUser().build();

            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .status(RequestStatus.IN_PROGRESS)
                    .client(clientUser).category(category).build();

            Proposal prop = Proposal.builder().id(1L).request(request)
                    .provider(provider).status(ProposalStatus.ACCEPTED).build();

            com.agroconnect.model.ServiceExecution execution = com.agroconnect.model.ServiceExecution.builder()
                    .id(1L).proposal(prop).build();

            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(provider));
            when(executionRepository.findActiveByProviderId(1L)).thenReturn(List.of(execution));
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(List.of());

            var result = service.getActiveJobsForProvider(2L);

            assertEquals(1, result.size());
            assertEquals("Lavoura de 2 hectares", result.get(0).requestTitle());
        }

        @Test
        void getActiveJobsForProvider_givenNoProfile_shouldThrowNotFound() {
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> service.getActiveJobsForProvider(99L));
        }
    }

    // ========================================================================
    // Photo Upload — MinIO error path
    // ========================================================================

    @Nested
    class MinioErrorTests {

        @Test
        void generateUploadUrl_givenMinioFailure_shouldThrowValidation() throws Exception {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenThrow(new RuntimeException("MinIO connection refused"));

            assertThrows(ValidationException.class, () -> service.generateUploadUrl(1L, 1L));
        }

        @Test
        void generateUploadUrl_defaultContentType_shouldCallWithJpeg() throws Exception {
            ServiceRequest request = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
            when(photoRepository.countByRequestId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("http://minio:9000/agroconnect/requests/1/test.jpg");

            // Calling the single-arg version should default to image/jpeg
            PresignedUrlResponse response = service.generateUploadUrl(1L, 1L);

            assertNotNull(response);
            assertTrue(response.objectKey().endsWith(".jpg"));
        }
    }

    // ========================================================================
    // Update with all fields
    // ========================================================================

    @Nested
    class UpdateAllFieldsTests {

        @Test
        void update_givenAllFields_shouldUpdateEverything() {
            ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                    .client(clientUser).category(category).build();

            UpdateServiceRequestDto dto = new UpdateServiceRequestDto(
                    null, "New Title", "New Desc",
                    38.7, -27.3, "Ribeira Grande", "Ribeira Grande", "São Miguel",
                    5.0, "m2", Urgency.HIGH,
                    java.time.LocalDate.of(2026, 5, 1),
                    java.time.LocalDate.of(2026, 5, 15),
                    "{\"field\": \"value\"}");

            when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(draftRequest);
            when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

            service.update(1L, dto, 1L);

            assertEquals("New Title", draftRequest.getTitle());
            assertEquals("New Desc", draftRequest.getDescription());
            assertEquals("Ribeira Grande", draftRequest.getParish());
            assertEquals("São Miguel", draftRequest.getIsland());
            assertEquals(5.0, draftRequest.getArea());
            assertEquals("m2", draftRequest.getAreaUnit());
            assertEquals(Urgency.HIGH, draftRequest.getUrgency());
            assertEquals("{\"field\": \"value\"}", draftRequest.getFormData());
        }
    }
}
