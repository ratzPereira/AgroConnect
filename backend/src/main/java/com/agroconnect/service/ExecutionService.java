package com.agroconnect.service;

import com.agroconnect.dto.request.AssignExecutionDto;
import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.dto.response.ServiceExecutionResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.mapper.ExecutionMapper;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.ExecutionPhoto;
import com.agroconnect.model.Machine;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.TeamMember;
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
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExecutionService {

    private static final Logger log = LoggerFactory.getLogger(ExecutionService.class);

    private static final int SRID_WGS84 = 4326;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);
    private static final double CHECKIN_RADIUS_METERS = 500;
    private static final int PRESIGNED_URL_EXPIRY_MINUTES = 15;
    private static final int MAX_EXECUTION_PHOTOS = 20;

    private final ServiceExecutionRepository executionRepository;
    private final ExecutionAssignmentRepository assignmentRepository;
    private final ExecutionPhotoRepository photoRepository;
    private final ProposalRepository proposalRepository;
    private final ServiceRequestRepository requestRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MachineRepository machineRepository;
    private final NotificationService notificationService;
    private final MinioClient minioClient;
    private final ApplicationEventPublisher eventPublisher;
    private final UserDisplayNameResolver nameResolver;

    @Value("${agroconnect.minio.bucket}")
    private String minioBucket;

    @Value("${agroconnect.minio.endpoint}")
    private String minioEndpoint;

    @Value("${agroconnect.minio.public-endpoint}")
    private String minioPublicEndpoint;

    @Transactional
    public ServiceExecution createForProposal(Proposal proposal) {
        var builder = ServiceExecution.builder()
                .proposal(proposal);

        // Auto-set scheduling dates from proposal's estimated date
        if (proposal.getEstimatedDate() != null) {
            builder.scheduledDate(proposal.getEstimatedDate());
            builder.scheduledEndDate(proposal.getEstimatedDate());
        }

        ServiceExecution execution = builder.build();
        execution = executionRepository.save(execution);
        log.info("Execution created: {} for proposal {}", execution.getId(), proposal.getId());
        return execution;
    }

    public ServiceExecutionResponse getByRequestId(Long requestId, Long userId, boolean isAdmin) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de serviço não encontrado."));

        Proposal acceptedProposal = findAcceptedProposal(requestId);

        // Validate authorization: client, the provider's user, or an admin (dispute review)
        boolean isClient = request.getClient().getId().equals(userId);
        boolean isProviderUser = acceptedProposal.getProvider().getUser().getId().equals(userId);
        if (!isAdmin && !isClient && !isProviderUser) {
            throw new ForbiddenException("Não tem permissão para ver esta execução.");
        }

        ServiceExecution execution = executionRepository.findByProposalId(acceptedProposal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Execução não encontrada."));

        return ExecutionMapper.toResponse(execution);
    }

    @Transactional
    public ServiceExecutionResponse assign(Long executionId, AssignExecutionDto dto, Long userId) {
        ServiceExecution execution = findByIdOrThrow(executionId);
        ProviderProfile provider = validateProviderAccess(execution, userId);

        TeamMember teamMember = teamMemberRepository.findByIdAndProviderId(dto.teamMemberId(), provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Membro de equipa não encontrado."));

        if (!teamMember.isActive()) {
            throw new ValidationException("Este membro de equipa não está ativo.");
        }

        if (assignmentRepository.existsByExecutionIdAndTeamMemberId(executionId, dto.teamMemberId())) {
            throw new InvalidStateException("Este membro de equipa já está atribuído a esta execução.");
        }

        Machine machine = null;
        if (dto.machineId() != null) {
            machine = machineRepository.findByIdAndProviderId(dto.machineId(), provider.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Máquina não encontrada."));
        }

        ExecutionAssignment assignment = ExecutionAssignment.builder()
                .execution(execution)
                .teamMember(teamMember)
                .machine(machine)
                .build();

        assignmentRepository.save(assignment);

        execution = findByIdOrThrow(executionId);
        log.info("Assignment created for execution {}: member {}, machine {}",
                executionId, dto.teamMemberId(), dto.machineId());
        return ExecutionMapper.toResponse(execution);
    }

    @Transactional
    public ServiceExecutionResponse checkin(Long executionId, CheckinExecutionDto dto, Long userId) {
        ServiceExecution execution = findByIdOrThrow(executionId);
        validateProviderAccess(execution, userId);

        ServiceRequest request = execution.getProposal().getRequest();

        if (request.getStatus() != RequestStatus.AWARDED) {
            throw new InvalidStateException("O pedido deve estar no estado AWARDED para fazer check-in.");
        }

        if (execution.getCheckinTime() != null) {
            throw new InvalidStateException("Já foi feito check-in nesta execução.");
        }

        Point checkinPoint = createPoint(dto.longitude(), dto.latitude());
        Point requestLocation = request.getLocation();

        if (!isWithinRadius(checkinPoint, requestLocation, CHECKIN_RADIUS_METERS)) {
            throw new ValidationException(
                    "A sua localização está demasiado longe do local do serviço. Deve estar a menos de 500 metros.");
        }

        execution.setCheckinLocation(checkinPoint);
        execution.setCheckinTime(Instant.now());
        executionRepository.save(execution);

        // Transition request AWARDED → IN_PROGRESS
        request.setStatus(RequestStatus.IN_PROGRESS);
        requestRepository.save(request);

        log.info("Check-in completed for execution {}", executionId);
        return ExecutionMapper.toResponse(execution);
    }

    public PresignedUrlResponse generatePhotoUploadUrl(Long executionId, Long userId) {
        return generatePhotoUploadUrl(executionId, userId, "image/jpeg");
    }

    public PresignedUrlResponse generatePhotoUploadUrl(Long executionId, Long userId, String contentType) {
        ServiceExecution execution = findByIdOrThrow(executionId);
        validateProviderAccess(execution, userId);

        if (execution.getCompletedAt() != null) {
            throw new InvalidStateException("Não é possível adicionar fotos após a conclusão.");
        }
        if (execution.getCheckinTime() == null) {
            throw new InvalidStateException("É necessário fazer check-in antes de adicionar fotos.");
        }

        long photoCount = photoRepository.countByExecutionId(execution.getId());
        if (photoCount >= MAX_EXECUTION_PHOTOS) {
            throw new InvalidStateException("Limite máximo de " + MAX_EXECUTION_PHOTOS + " fotos por execução atingido.");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String objectKey = "executions/" + executionId + "/" + UUID.randomUUID() + extension;

        try {
            String uploadUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(minioBucket)
                            .object(objectKey)
                            .expiry(PRESIGNED_URL_EXPIRY_MINUTES, TimeUnit.MINUTES)
                            .build());

            // Replace internal Docker hostname with public endpoint (proxied through Nginx)
            uploadUrl = uploadUrl.replace(minioEndpoint, minioPublicEndpoint);
            String publicUrl = minioPublicEndpoint + "/" + minioBucket + "/" + objectKey;
            return new PresignedUrlResponse(uploadUrl, objectKey, publicUrl);
        } catch (Exception e) {
            log.error("Failed to generate presigned URL for execution {}", executionId, e);
            throw new ValidationException("Não foi possível gerar o URL de upload.");
        }
    }

    @Transactional
    public ServiceExecutionResponse confirmPhoto(Long executionId, String photoUrl,
                                                  Double latitude, Double longitude,
                                                  Instant takenAt, Long userId) {
        ServiceExecution execution = findByIdOrThrow(executionId);
        validateProviderAccess(execution, userId);

        if (execution.getCompletedAt() != null) {
            throw new InvalidStateException("Não é possível adicionar fotos após a conclusão.");
        }
        if (execution.getCheckinTime() == null) {
            throw new InvalidStateException("É necessário fazer check-in antes de adicionar fotos.");
        }

        Point location = null;
        if (latitude != null && longitude != null) {
            location = createPoint(longitude, latitude);
        }

        ExecutionPhoto photo = ExecutionPhoto.builder()
                .execution(execution)
                .photoUrl(photoUrl)
                .location(location)
                .takenAt(takenAt)
                .build();

        photoRepository.save(photo);

        execution = findByIdOrThrow(executionId);
        log.info("Photo confirmed for execution {}: {}", executionId, photoUrl);
        return ExecutionMapper.toResponse(execution);
    }

    @Transactional
    public ServiceExecutionResponse complete(Long executionId, CompleteExecutionDto dto, Long userId) {
        ServiceExecution execution = findByIdOrThrow(executionId);
        validateProviderAccess(execution, userId);

        ServiceRequest request = execution.getProposal().getRequest();

        if (execution.getCompletedAt() != null) {
            throw new InvalidStateException("Esta execução já foi concluída.");
        }

        if (request.getStatus() != RequestStatus.IN_PROGRESS) {
            throw new InvalidStateException("O pedido deve estar no estado IN_PROGRESS para ser concluído.");
        }

        if (execution.getCheckinTime() == null) {
            throw new InvalidStateException("Deve fazer check-in antes de concluir a execução.");
        }

        execution.setNotes(dto.notes());
        execution.setMaterialsUsed(dto.materialsUsed());
        execution.setCompletedAt(Instant.now());
        execution.setCheckoutTime(Instant.now());

        // Snapshot hourly rate on every assignment BEFORE we save the
        // execution. After completedAt is set, costing data is frozen, so
        // later edits to teamMember.hourlyRate must not retroactively change
        // historical labor cost.
        for (ExecutionAssignment assignment : assignmentRepository.findByExecutionId(executionId)) {
            if (assignment.getHourlyRateSnapshot() == null) {
                assignment.setHourlyRateSnapshot(assignment.getTeamMember().getHourlyRate());
                assignmentRepository.save(assignment);
            }
        }

        executionRepository.save(execution);

        // Transition request IN_PROGRESS → AWAITING_CONFIRMATION
        request.setStatus(RequestStatus.AWAITING_CONFIRMATION);
        requestRepository.save(request);

        // Notify client
        notificationService.create(
                request.getClient().getId(),
                "EXECUTION_COMPLETED",
                "Serviço concluído",
                "O prestador concluiu o serviço \"" + request.getTitle() + "\". Por favor confirme a conclusão.",
                "{\"requestId\":" + request.getId() + "}"
        );

        ProviderProfile provider = execution.getProposal().getProvider();
        eventPublisher.publishEvent(new com.agroconnect.event.WorkMarkedCompleteEvent(
                request.getId(),
                request.getClient().getId(),
                request.getClient().getEmail(),
                nameResolver.resolve(request.getClient()),
                provider.getCompanyName(),
                Instant.now()));

        log.info("Execution {} completed for request {}", executionId, request.getId());
        return ExecutionMapper.toResponse(execution);
    }

    private ServiceExecution findByIdOrThrow(Long id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Execução não encontrada."));
    }

    private ProviderProfile validateProviderAccess(ServiceExecution execution, Long userId) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));

        if (!execution.getProposal().getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenException("Não tem permissão para aceder a esta execução.");
        }

        return provider;
    }

    private Proposal findAcceptedProposal(Long requestId) {
        return proposalRepository.findByRequestId(requestId).stream()
                .filter(p -> p.getStatus() == ProposalStatus.ACCEPTED)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Proposta aceite não encontrada."));
    }

    private boolean isWithinRadius(Point point1, Point point2, double radiusMeters) {
        // Haversine formula for distance calculation
        double lat1 = Math.toRadians(point1.getY());
        double lat2 = Math.toRadians(point2.getY());
        double dLat = Math.toRadians(point2.getY() - point1.getY());
        double dLon = Math.toRadians(point2.getX() - point1.getX());

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = 6371000 * c;

        return distance <= radiusMeters;
    }

    private Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }
}
