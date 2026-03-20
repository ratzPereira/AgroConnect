package com.agroconnect.unit;

import com.agroconnect.dto.request.AssignExecutionDto;
import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.response.ServiceExecutionResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
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
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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

    private ExecutionService service;

    private User clientUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private ServiceRequest awardedRequest;
    private ServiceRequest inProgressRequest;
    private Proposal acceptedProposal;
    private ServiceExecution execution;
    private TeamMember teamMember;
    private Machine machine;

    @BeforeEach
    void setUp() {
        service = new ExecutionService(
                executionRepository, assignmentRepository, photoRepository,
                proposalRepository, requestRepository, providerProfileRepository,
                teamMemberRepository, machineRepository, notificationService,
                minioClient);

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

        execution = ExecutionFixture.anExecution()
                .proposal(acceptedProposal).build();

        teamMember = ExecutionFixture.aTeamMember().provider(providerProfile).build();
        machine = ExecutionFixture.aMachine().provider(providerProfile).build();
    }

    @Test
    void createForProposal_shouldCreateExecution() {
        when(executionRepository.save(any(ServiceExecution.class))).thenReturn(execution);

        ServiceExecution result = service.createForProposal(acceptedProposal);

        assertNotNull(result);
        verify(executionRepository).save(any(ServiceExecution.class));
    }

    @Test
    void assign_givenValidData_shouldCreateAssignment() {
        AssignExecutionDto dto = new AssignExecutionDto(1L, 1L);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));
        when(assignmentRepository.existsByExecutionIdAndTeamMemberId(1L, 1L)).thenReturn(false);
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.save(any())).thenReturn(ExecutionFixture.anAssignment()
                .execution(execution).teamMember(teamMember).machine(machine).build());

        ServiceExecutionResponse response = service.assign(1L, dto, 2L);

        assertNotNull(response);
        verify(assignmentRepository).save(any());
    }

    @Test
    void assign_givenDuplicateAssignment_shouldThrowInvalidState() {
        AssignExecutionDto dto = new AssignExecutionDto(1L, null);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));
        when(assignmentRepository.existsByExecutionIdAndTeamMemberId(1L, 1L)).thenReturn(true);

        assertThrows(InvalidStateException.class, () -> service.assign(1L, dto, 2L));
    }

    @Test
    void assign_givenWrongProvider_shouldThrowForbidden() {
        AssignExecutionDto dto = new AssignExecutionDto(1L, null);
        ProviderProfile otherProvider = UserFixture.aProviderProfile().id(99L)
                .user(UserFixture.aProviderUser().id(99L).build()).build();

        when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.of(otherProvider));

        assertThrows(ForbiddenException.class, () -> service.assign(1L, dto, 99L));
    }

    @Test
    void checkin_givenWithinRadius_shouldSucceed() {
        // Request location is at -27.2167, 38.6667
        // Check-in location is very close (within 500m)
        CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(executionRepository.save(any(ServiceExecution.class))).thenReturn(execution);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(awardedRequest);

        ServiceExecutionResponse response = service.checkin(1L, dto, 2L);

        assertNotNull(response);
        verify(requestRepository).save(any(ServiceRequest.class));
    }

    @Test
    void checkin_givenTooFar_shouldThrowValidation() {
        // Check-in at a completely different location (e.g. Lisbon, ~1500km away)
        CheckinExecutionDto dto = new CheckinExecutionDto(38.7223, -9.1393);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(execution));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        assertThrows(ValidationException.class, () -> service.checkin(1L, dto, 2L));
    }

    @Test
    void checkin_givenAlreadyCheckedIn_shouldThrowInvalidState() {
        ServiceExecution checkedIn = ExecutionFixture.aCheckedInExecution()
                .proposal(acceptedProposal).build();
        CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedIn));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        assertThrows(InvalidStateException.class, () -> service.checkin(1L, dto, 2L));
    }

    @Test
    void checkin_givenWrongRequestStatus_shouldThrowInvalidState() {
        Proposal proposalWithInProgress = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(inProgressRequest).provider(providerProfile).build();
        ServiceExecution exec = ExecutionFixture.anExecution()
                .proposal(proposalWithInProgress).build();
        CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(exec));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        assertThrows(InvalidStateException.class, () -> service.checkin(1L, dto, 2L));
    }

    @Test
    void complete_givenCheckedInExecution_shouldCompleteAndNotify() {
        Proposal proposalInProgress = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(inProgressRequest).provider(providerProfile).build();
        ServiceExecution checkedIn = ExecutionFixture.aCheckedInExecution()
                .proposal(proposalInProgress).build();
        CompleteExecutionDto dto = new CompleteExecutionDto("Tudo feito", null);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedIn));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(executionRepository.save(any(ServiceExecution.class))).thenReturn(checkedIn);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(inProgressRequest);

        ServiceExecutionResponse response = service.complete(1L, dto, 2L);

        assertNotNull(response);
        verify(notificationService).create(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void complete_givenNoCheckin_shouldThrowInvalidState() {
        Proposal proposalInProgress = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(inProgressRequest).provider(providerProfile).build();
        ServiceExecution noCheckin = ExecutionFixture.anExecution()
                .proposal(proposalInProgress).build();
        CompleteExecutionDto dto = new CompleteExecutionDto(null, null);

        when(executionRepository.findById(1L)).thenReturn(Optional.of(noCheckin));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        assertThrows(InvalidStateException.class, () -> service.complete(1L, dto, 2L));
    }
}
