package com.agroconnect.unit;

import com.agroconnect.dto.request.AssignExecutionDto;
import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.dto.response.ServiceExecutionResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.ExecutionPhoto;
import com.agroconnect.model.Machine;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ExecutionPhotoRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TeamMemberRepository;
import com.agroconnect.service.ExecutionService;
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.UserDisplayNameResolver;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import org.springframework.context.ApplicationEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExecutionServiceTest {

    @Mock private ServiceExecutionRepository executionRepository;
    @Mock private ExecutionAssignmentRepository assignmentRepository;
    @Mock private ExecutionPhotoRepository photoRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private ServiceRequestRepository requestRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private MachineRepository machineRepository;
    @Mock private NotificationService notificationService;
    @Mock private MinioClient minioClient;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private UserDisplayNameResolver nameResolver;

    private ExecutionService service;

    private User clientUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private ServiceRequest awardedRequest;
    private ServiceRequest inProgressRequest;
    private Proposal acceptedProposal;
    private Proposal acceptedProposalInProgress;
    private ServiceExecution execution;
    private ServiceExecution checkedInExecution;
    private ServiceExecution completedExecution;
    private TeamMember teamMember;
    private Machine machine;

    @BeforeEach
    void setUp() {
        service = new ExecutionService(
                executionRepository, assignmentRepository, photoRepository,
                proposalRepository, requestRepository, providerProfileRepository,
                teamMemberRepository, machineRepository, notificationService,
                minioClient, eventPublisher, nameResolver);

        // Set @Value fields via reflection since we are not using Spring context
        setField(service, "minioBucket", "agroconnect");
        setField(service, "minioEndpoint", "http://minio:9000");
        setField(service, "minioPublicEndpoint", "http://localhost:9000");

        clientUser = UserFixture.aClientUser().build();
        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();

        awardedRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.AWARDED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        inProgressRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.IN_PROGRESS).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        acceptedProposal = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(awardedRequest).provider(providerProfile).build();

        acceptedProposalInProgress = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(inProgressRequest).provider(providerProfile).build();

        execution = ExecutionFixture.anExecution()
                .proposal(acceptedProposal).build();

        checkedInExecution = ExecutionFixture.aCheckedInExecution()
                .proposal(acceptedProposalInProgress).build();

        completedExecution = ExecutionFixture.aCompletedExecution()
                .proposal(acceptedProposalInProgress).build();

        teamMember = ExecutionFixture.aTeamMember().provider(providerProfile).build();
        machine = ExecutionFixture.aMachine().provider(providerProfile).build();
    }

    // =========================================================================
    // Execution Creation
    // =========================================================================
    @Nested
    class CreateForProposal {

        @Test
        void create_givenAcceptedProposal_shouldCreateExecution() {
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(execution);

            ServiceExecution result = service.createForProposal(acceptedProposal);

            assertNotNull(result);
            verify(executionRepository).save(any(ServiceExecution.class));
        }

        @Test
        void create_givenProposalWithEstimatedDate_shouldSetScheduledDates() {
            java.time.LocalDate estimatedDate = java.time.LocalDate.of(2026, 4, 15);
            Proposal proposalWithDate = ProposalFixture.aProposal()
                    .status(ProposalStatus.ACCEPTED)
                    .estimatedDate(estimatedDate)
                    .request(awardedRequest).provider(providerProfile).build();

            ArgumentCaptor<ServiceExecution> captor = ArgumentCaptor.forClass(ServiceExecution.class);
            when(executionRepository.save(captor.capture())).thenReturn(execution);

            service.createForProposal(proposalWithDate);

            ServiceExecution saved = captor.getValue();
            assertEquals(estimatedDate, saved.getScheduledDate());
            assertEquals(estimatedDate, saved.getScheduledEndDate());
        }

        @Test
        void create_givenProposalWithoutEstimatedDate_shouldNotSetScheduledDates() {
            Proposal proposalNoDate = ProposalFixture.aProposal()
                    .status(ProposalStatus.ACCEPTED)
                    .estimatedDate(null)
                    .request(awardedRequest).provider(providerProfile).build();

            ArgumentCaptor<ServiceExecution> captor = ArgumentCaptor.forClass(ServiceExecution.class);
            when(executionRepository.save(captor.capture())).thenReturn(execution);

            service.createForProposal(proposalNoDate);

            ServiceExecution saved = captor.getValue();
            assertNull(saved.getScheduledDate());
            assertNull(saved.getScheduledEndDate());
        }
    }

    // =========================================================================
    // Team Assignment
    // =========================================================================
    @Nested
    class AssignTeam {

        @Test
        void assignTeam_givenValidMembers_shouldCreateAssignments() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, 1L);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));
            when(assignmentRepository.existsByExecutionIdAndTeamMemberId(1L, 1L)).thenReturn(false);
            when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
            when(assignmentRepository.save(any(ExecutionAssignment.class))).thenReturn(
                    ExecutionFixture.anAssignment().execution(execution).teamMember(teamMember).machine(machine).build());
            // The method re-fetches the execution after saving the assignment
            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));

            ServiceExecutionResponse response = service.assign(1L, dto, 2L);

            assertNotNull(response);
            verify(assignmentRepository).save(any(ExecutionAssignment.class));
        }

        @Test
        void assignTeam_givenNonProviderUser_shouldThrowForbidden() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, null);
            ProviderProfile otherProvider = UserFixture.aProviderProfile().id(99L)
                    .user(UserFixture.aProviderUser().id(99L).build()).build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.of(otherProvider));

            assertThrows(ForbiddenException.class, () -> service.assign(1L, dto, 99L));
            verify(assignmentRepository, never()).save(any(ExecutionAssignment.class));
        }

        @Test
        void assignTeam_givenUserWithNoProviderProfile_shouldThrowNotFound() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(50L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.assign(1L, dto, 50L));
        }

        @Test
        void assignTeam_givenDuplicateAssignment_shouldThrowInvalidState() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));
            when(assignmentRepository.existsByExecutionIdAndTeamMemberId(1L, 1L)).thenReturn(true);

            assertThrows(InvalidStateException.class, () -> service.assign(1L, dto, 2L));
        }

        @Test
        void assignTeam_givenInactiveTeamMember_shouldThrowValidation() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, null);
            TeamMember inactiveMember = ExecutionFixture.aTeamMember()
                    .provider(providerProfile).active(false).build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(inactiveMember));

            assertThrows(ValidationException.class, () -> service.assign(1L, dto, 2L));
        }

        @Test
        void assignTeam_givenNonExistentExecution_shouldThrowNotFound() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, null);

            when(executionRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.assign(999L, dto, 2L));
        }

        @Test
        void assignTeam_givenNullMachineId_shouldAssignWithoutMachine() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));
            when(assignmentRepository.existsByExecutionIdAndTeamMemberId(1L, 1L)).thenReturn(false);
            when(assignmentRepository.save(any(ExecutionAssignment.class))).thenReturn(
                    ExecutionFixture.anAssignment().execution(execution).teamMember(teamMember).machine(null).build());
            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));

            ServiceExecutionResponse response = service.assign(1L, dto, 2L);

            assertNotNull(response);
            verify(machineRepository, never()).findByIdAndProviderId(anyLong(), anyLong());
        }

        @Test
        void assignTeam_givenNonExistentTeamMember_shouldThrowNotFound() {
            AssignExecutionDto dto = new AssignExecutionDto(999L, null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(teamMemberRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.assign(1L, dto, 2L));
        }

        @Test
        void assignTeam_givenNonExistentMachine_shouldThrowNotFound() {
            AssignExecutionDto dto = new AssignExecutionDto(1L, 999L);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));
            when(assignmentRepository.existsByExecutionIdAndTeamMemberId(1L, 1L)).thenReturn(false);
            when(machineRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.assign(1L, dto, 2L));
        }
    }

    // =========================================================================
    // Check-in
    // =========================================================================
    @Nested
    class Checkin {

        @Test
        void checkin_givenAwardedRequest_shouldSetCheckinTime() {
            CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(execution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(awardedRequest);

            service.checkin(1L, dto, 2L);

            ArgumentCaptor<ServiceExecution> captor = ArgumentCaptor.forClass(ServiceExecution.class);
            verify(executionRepository).save(captor.capture());
            assertNotNull(captor.getValue().getCheckinTime());
        }

        @Test
        void checkin_givenAwardedRequest_shouldTransitionToInProgress() {
            CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(execution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(awardedRequest);

            service.checkin(1L, dto, 2L);

            ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
            verify(requestRepository).save(captor.capture());
            assertEquals(RequestStatus.IN_PROGRESS, captor.getValue().getStatus());
        }

        @Test
        void checkin_givenNonAwardedRequest_shouldThrowInvalidState() {
            // Create an execution whose request is IN_PROGRESS (not AWARDED)
            ServiceExecution execInProgress = ExecutionFixture.anExecution()
                    .proposal(acceptedProposalInProgress).build();
            CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execInProgress));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class, () -> service.checkin(1L, dto, 2L));
            verify(executionRepository, never()).save(any(ServiceExecution.class));
        }

        @Test
        void checkin_givenAlreadyCheckedIn_shouldThrowInvalidState() {
            // Use an awarded request but with checkin already set
            ServiceExecution alreadyCheckedIn = ExecutionFixture.aCheckedInExecution()
                    .proposal(acceptedProposal).build();
            CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(alreadyCheckedIn));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class, () -> service.checkin(1L, dto, 2L));
            verify(executionRepository, never()).save(any(ServiceExecution.class));
        }

        @Test
        void checkin_givenTooFarFromLocation_shouldThrowValidation() {
            // Lisbon coordinates, ~1500km from Azores request location
            CheckinExecutionDto dto = new CheckinExecutionDto(38.7223, -9.1393);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(ValidationException.class, () -> service.checkin(1L, dto, 2L));
            verify(executionRepository, never()).save(any(ServiceExecution.class));
            verify(requestRepository, never()).save(any(ServiceRequest.class));
        }

        @Test
        void checkin_givenNonProviderUser_shouldThrowForbidden() {
            CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);
            ProviderProfile otherProvider = UserFixture.aProviderProfile().id(99L)
                    .user(UserFixture.aProviderUser().id(99L).build()).build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.of(otherProvider));

            assertThrows(ForbiddenException.class, () -> service.checkin(1L, dto, 99L));
            verify(executionRepository, never()).save(any(ServiceExecution.class));
        }

        @Test
        void checkin_givenNonExistentExecution_shouldThrowNotFound() {
            CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

            when(executionRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.checkin(999L, dto, 2L));
        }

        @Test
        void checkin_givenWithinRadius_shouldSetCheckinLocation() {
            CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(execution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(awardedRequest);

            service.checkin(1L, dto, 2L);

            ArgumentCaptor<ServiceExecution> captor = ArgumentCaptor.forClass(ServiceExecution.class);
            verify(executionRepository).save(captor.capture());
            assertNotNull(captor.getValue().getCheckinLocation());
        }
    }

    // =========================================================================
    // Photo Upload
    // =========================================================================
    @Nested
    class PhotoUpload {

        @Test
        void generatePhotoUploadUrl_givenActiveExecution_shouldReturnUrl() throws Exception {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(photoRepository.countByExecutionId(1L)).thenReturn(0);
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("http://minio:9000/agroconnect/executions/1/test.jpg");

            PresignedUrlResponse response = service.generatePhotoUploadUrl(1L, 2L);

            assertNotNull(response);
            assertNotNull(response.uploadUrl());
            assertNotNull(response.objectKey());
        }

        @Test
        void generatePhotoUploadUrl_givenCompletedExecution_shouldThrow() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(completedExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class,
                    () -> service.generatePhotoUploadUrl(1L, 2L));
        }

        @Test
        void generatePhotoUploadUrl_givenNoCheckin_shouldThrow() {
            // Execution without checkin (no checkinTime set)
            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class,
                    () -> service.generatePhotoUploadUrl(1L, 2L));
        }

        @Test
        void generatePhotoUploadUrl_givenMaxPhotosReached_shouldThrow() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(photoRepository.countByExecutionId(1L)).thenReturn(20);

            assertThrows(InvalidStateException.class,
                    () -> service.generatePhotoUploadUrl(1L, 2L));
        }

        @Test
        void generatePhotoUploadUrl_givenNonProviderUser_shouldThrowForbidden() {
            ProviderProfile otherProvider = UserFixture.aProviderProfile().id(99L)
                    .user(UserFixture.aProviderUser().id(99L).build()).build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.of(otherProvider));

            assertThrows(ForbiddenException.class,
                    () -> service.generatePhotoUploadUrl(1L, 99L));
        }

        @Test
        void confirmPhoto_givenValidUrl_shouldSavePhoto() {
            String photoUrl = "http://minio:9000/agroconnect/executions/1/photo.jpg";
            Instant takenAt = Instant.now();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(photoRepository.save(any(ExecutionPhoto.class))).thenReturn(
                    ExecutionPhoto.builder()
                            .id(1L).execution(checkedInExecution).photoUrl(photoUrl)
                            .takenAt(takenAt).uploadedAt(Instant.now()).build());
            // Re-fetch after save
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));

            ServiceExecutionResponse response = service.confirmPhoto(1L, photoUrl, 38.6667, -27.2167, takenAt, 2L);

            assertNotNull(response);
            verify(photoRepository).save(any(ExecutionPhoto.class));
        }

        @Test
        void confirmPhoto_givenCompletedExecution_shouldThrow() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(completedExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class,
                    () -> service.confirmPhoto(1L, "http://url", null, null, null, 2L));
        }

        @Test
        void confirmPhoto_givenNoCheckin_shouldThrow() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class,
                    () -> service.confirmPhoto(1L, "http://url", null, null, null, 2L));
        }

        @Test
        void confirmPhoto_givenNullCoordinates_shouldSaveWithoutLocation() {
            String photoUrl = "http://minio:9000/agroconnect/executions/1/photo.jpg";

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            ArgumentCaptor<ExecutionPhoto> captor = ArgumentCaptor.forClass(ExecutionPhoto.class);
            when(photoRepository.save(captor.capture())).thenReturn(
                    ExecutionPhoto.builder().id(1L).execution(checkedInExecution)
                            .photoUrl(photoUrl).uploadedAt(Instant.now()).build());
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));

            service.confirmPhoto(1L, photoUrl, null, null, null, 2L);

            assertNull(captor.getValue().getLocation());
        }
    }

    // =========================================================================
    // Completion
    // =========================================================================
    @Nested
    class Complete {

        @Test
        void complete_givenInProgressRequest_shouldSetCompletedAt() {
            CompleteExecutionDto dto = new CompleteExecutionDto("Tudo concluído", null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedInExecution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

            service.complete(1L, dto, 2L);

            ArgumentCaptor<ServiceExecution> captor = ArgumentCaptor.forClass(ServiceExecution.class);
            verify(executionRepository).save(captor.capture());
            assertNotNull(captor.getValue().getCompletedAt());
        }

        @Test
        void complete_givenInProgressRequest_shouldTransitionToAwaitingConfirmation() {
            CompleteExecutionDto dto = new CompleteExecutionDto("Tudo feito", null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedInExecution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

            service.complete(1L, dto, 2L);

            ArgumentCaptor<ServiceRequest> captor = ArgumentCaptor.forClass(ServiceRequest.class);
            verify(requestRepository).save(captor.capture());
            assertEquals(RequestStatus.AWAITING_CONFIRMATION, captor.getValue().getStatus());
        }

        @Test
        void complete_givenNonInProgressRequest_shouldThrowInvalidState() {
            // Execution linked to AWARDED request (not IN_PROGRESS)
            CompleteExecutionDto dto = new CompleteExecutionDto(null, null);

            // Use a checked-in execution but with AWARDED request
            ServiceExecution checkedInAwarded = ExecutionFixture.aCheckedInExecution()
                    .proposal(acceptedProposal).build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInAwarded));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class, () -> service.complete(1L, dto, 2L));
            verify(executionRepository, never()).save(any(ServiceExecution.class));
        }

        @Test
        void complete_givenAlreadyCompletedExecution_shouldThrowInvalidState() {
            // Audit S1.9: prevent double-completion (and the duplicate snapshot/notification side-effects).
            ServiceExecution alreadyCompleted = ExecutionFixture.aCheckedInExecution()
                    .proposal(acceptedProposalInProgress)
                    .completedAt(java.time.Instant.now())
                    .build();
            CompleteExecutionDto dto = new CompleteExecutionDto(null, null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(alreadyCompleted));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class, () -> service.complete(1L, dto, 2L));
            verify(executionRepository, never()).save(any(ServiceExecution.class));
        }

        @Test
        void complete_givenNoCheckin_shouldThrowInvalidState() {
            // Execution without checkin but with IN_PROGRESS request
            ServiceExecution noCheckin = ExecutionFixture.anExecution()
                    .proposal(acceptedProposalInProgress).build();
            CompleteExecutionDto dto = new CompleteExecutionDto(null, null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(noCheckin));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class, () -> service.complete(1L, dto, 2L));
        }

        @Test
        void complete_givenNonProviderUser_shouldThrowForbidden() {
            CompleteExecutionDto dto = new CompleteExecutionDto("Done", null);
            ProviderProfile otherProvider = UserFixture.aProviderProfile().id(99L)
                    .user(UserFixture.aProviderUser().id(99L).build()).build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.of(otherProvider));

            assertThrows(ForbiddenException.class, () -> service.complete(1L, dto, 99L));
            verify(executionRepository, never()).save(any(ServiceExecution.class));
        }

        @Test
        void complete_shouldSaveNotesAndMaterials() {
            CompleteExecutionDto dto = new CompleteExecutionDto(
                    "Trabalho concluído sem incidentes",
                    "[{\"name\":\"Fertilizante\",\"qty\":10}]");

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedInExecution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

            service.complete(1L, dto, 2L);

            ArgumentCaptor<ServiceExecution> captor = ArgumentCaptor.forClass(ServiceExecution.class);
            verify(executionRepository).save(captor.capture());
            assertEquals("Trabalho concluído sem incidentes", captor.getValue().getNotes());
            assertEquals("[{\"name\":\"Fertilizante\",\"qty\":10}]", captor.getValue().getMaterialsUsed());
        }

        @Test
        void complete_shouldSetCheckoutTime() {
            CompleteExecutionDto dto = new CompleteExecutionDto("Done", null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedInExecution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

            service.complete(1L, dto, 2L);

            ArgumentCaptor<ServiceExecution> captor = ArgumentCaptor.forClass(ServiceExecution.class);
            verify(executionRepository).save(captor.capture());
            assertNotNull(captor.getValue().getCheckoutTime());
        }

        @Test
        void complete_shouldNotifyClient() {
            CompleteExecutionDto dto = new CompleteExecutionDto("Concluído", null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedInExecution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

            service.complete(1L, dto, 2L);

            verify(notificationService).create(
                    eq(clientUser.getId()),
                    eq("EXECUTION_COMPLETED"),
                    anyString(),
                    anyString(),
                    anyString());
        }

        @Test
        void complete_givenNonExistentExecution_shouldThrowNotFound() {
            CompleteExecutionDto dto = new CompleteExecutionDto(null, null);

            when(executionRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.complete(999L, dto, 2L));
        }

        @Test
        void complete_givenAssignmentWithoutSnapshot_shouldCaptureMembersCurrentRate() {
            CompleteExecutionDto dto = new CompleteExecutionDto("Concluído", null);
            TeamMember memberWithRate = ExecutionFixture.aTeamMember()
                    .provider(providerProfile)
                    .hourlyRate(new java.math.BigDecimal("12.50"))
                    .build();
            ExecutionAssignment unsnapped = ExecutionFixture.anAssignment()
                    .id(50L).execution(checkedInExecution).teamMember(memberWithRate)
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(java.util.List.of(unsnapped));
            when(assignmentRepository.save(any(ExecutionAssignment.class))).thenAnswer(inv -> inv.getArgument(0));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedInExecution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

            service.complete(1L, dto, 2L);

            assertEquals(new java.math.BigDecimal("12.50"), unsnapped.getHourlyRateSnapshot());
            verify(assignmentRepository).save(unsnapped);
        }

        @Test
        void complete_givenAssignmentAlreadySnapshot_shouldNotOverwrite() {
            CompleteExecutionDto dto = new CompleteExecutionDto("Concluído", null);
            TeamMember member = ExecutionFixture.aTeamMember()
                    .provider(providerProfile)
                    .hourlyRate(new java.math.BigDecimal("20.00"))
                    .build();
            ExecutionAssignment preSnapped = ExecutionFixture.anAssignment()
                    .id(60L).execution(checkedInExecution).teamMember(member)
                    .hourlyRateSnapshot(new java.math.BigDecimal("8.00"))
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(java.util.List.of(preSnapped));
            when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedInExecution);
            when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

            service.complete(1L, dto, 2L);

            assertEquals(new java.math.BigDecimal("8.00"), preSnapped.getHourlyRateSnapshot());
            verify(assignmentRepository, never()).save(preSnapped);
        }
    }

    // =========================================================================
    // Read / Query
    // =========================================================================
    @Nested
    class GetByRequestId {

        @Test
        void getByRequestId_givenExistingExecution_shouldReturnResponse() {
            when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
            when(executionRepository.findByProposalId(1L)).thenReturn(Optional.of(execution));

            // Client user (id=1) is the client of the request
            ServiceExecutionResponse response = service.getByRequestId(1L, clientUser.getId());

            assertNotNull(response);
            assertEquals(execution.getId(), response.id());
        }

        @Test
        void getByRequestId_givenProviderUser_shouldReturnResponse() {
            when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
            when(executionRepository.findByProposalId(1L)).thenReturn(Optional.of(execution));

            // Provider user (id=2) is the provider of the proposal
            ServiceExecutionResponse response = service.getByRequestId(1L, providerUser.getId());

            assertNotNull(response);
            assertEquals(execution.getId(), response.id());
        }

        @Test
        void getByRequestId_givenNonParticipant_shouldThrowForbidden() {
            when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

            // User id=50 is neither client nor provider
            assertThrows(ForbiddenException.class,
                    () -> service.getByRequestId(1L, 50L));
        }

        @Test
        void getByRequestId_givenNoExecution_shouldThrowNotFound() {
            when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
            when(executionRepository.findByProposalId(1L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> service.getByRequestId(1L, clientUser.getId()));
        }

        @Test
        void getByRequestId_givenNoRequest_shouldThrowNotFound() {
            when(requestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> service.getByRequestId(999L, clientUser.getId()));
        }

        @Test
        void getByRequestId_givenNoAcceptedProposal_shouldThrowNotFound() {
            // Return proposals but none are ACCEPTED
            Proposal pendingProposal = ProposalFixture.aProposal()
                    .status(ProposalStatus.PENDING)
                    .request(awardedRequest).provider(providerProfile).build();

            when(requestRepository.findById(1L)).thenReturn(Optional.of(awardedRequest));
            when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(pendingProposal));

            assertThrows(ResourceNotFoundException.class,
                    () -> service.getByRequestId(1L, clientUser.getId()));
        }
    }

    /**
     * Sets a private field value via reflection, needed for @Value-injected fields
     * in unit tests where Spring context is not available.
     */
    private void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException("Failed to set field " + fieldName, e);
        }
    }
}
