package com.agroconnect.service;

import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.DisputeRequestDto;
import com.agroconnect.dto.request.ResolveDisputeDto;
import com.agroconnect.dto.request.UpdateServiceRequestDto;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.dto.response.ActiveJobResponse;
import com.agroconnect.dto.response.RequestPinResponse;
import com.agroconnect.dto.response.ServiceRequestResponse;
import com.agroconnect.dto.response.ServiceRequestSummaryResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.mapper.ServiceRequestMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.RequestPhoto;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.RequestPhotoRepository;
import com.agroconnect.repository.ServiceCategoryRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ServiceRequestService {

    private static final Logger log = LoggerFactory.getLogger(ServiceRequestService.class);

    private static final int SRID_WGS84 = 4326;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);
    private static final int EXPIRATION_DAYS = 30;
    private static final int MAX_PHOTOS = 10;
    private static final int PRESIGNED_URL_EXPIRY_MINUTES = 15;

    private static final String RESOURCE_SERVICE_REQUEST = "ServiceRequest";
    private static final String FIELD_NEW_STATUS = "newStatus";
    private static final String JSON_REQUEST_ID_PREFIX = "{\"requestId\":";
    private static final String ERR_PROVIDER_PROFILE_NOT_FOUND = "Perfil de prestador não encontrado.";
    private static final String EVENT_DISPUTE_RESOLVED = "DISPUTE_RESOLVED";
    private static final String LABEL_DISPUTE_RESOLVED = "Disputa resolvida";

    private static final Set<RequestStatus> TERMINAL_STATES = EnumSet.of(
            RequestStatus.RATED, RequestStatus.EXPIRED, RequestStatus.CANCELLED);

    private static final Map<RequestStatus, Set<RequestStatus>> VALID_TRANSITIONS = Map.of(
            RequestStatus.DRAFT, EnumSet.of(RequestStatus.PUBLISHED, RequestStatus.CANCELLED),
            RequestStatus.PUBLISHED, EnumSet.of(RequestStatus.WITH_PROPOSALS, RequestStatus.EXPIRED, RequestStatus.CANCELLED),
            RequestStatus.WITH_PROPOSALS, EnumSet.of(RequestStatus.AWARDED, RequestStatus.CANCELLED),
            RequestStatus.AWARDED, EnumSet.of(RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED),
            RequestStatus.IN_PROGRESS, EnumSet.of(RequestStatus.AWAITING_CONFIRMATION, RequestStatus.CANCELLED),
            RequestStatus.AWAITING_CONFIRMATION, EnumSet.of(RequestStatus.COMPLETED, RequestStatus.DISPUTED, RequestStatus.CANCELLED),
            RequestStatus.COMPLETED, EnumSet.of(RequestStatus.RATED),
            RequestStatus.DISPUTED, EnumSet.of(RequestStatus.COMPLETED, RequestStatus.CANCELLED)
    );

    private final ServiceRequestRepository requestRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final RequestPhotoRepository photoRepository;
    private final ProposalRepository proposalRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final NotificationService notificationService;
    private final ServiceExecutionRepository executionRepository;
    private final ExecutionAssignmentRepository assignmentRepository;
    private final AuditService auditService;
    private final MinioClient minioClient;

    @Value("${agroconnect.minio.bucket}")
    private String minioBucket;

    @Value("${agroconnect.minio.endpoint}")
    private String minioEndpoint;

    @Value("${agroconnect.minio.public-endpoint}")
    private String minioPublicEndpoint;

    @Transactional
    public ServiceRequestResponse create(CreateServiceRequestDto dto, Long userId) {
        User client = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        ServiceCategory category = categoryRepository.findById(dto.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));

        ServiceRequest request = ServiceRequest.builder()
                .client(client)
                .category(category)
                .status(RequestStatus.DRAFT)
                .title(dto.title())
                .description(dto.description())
                .location(createPoint(dto.longitude(), dto.latitude()))
                .parish(dto.parish())
                .municipality(dto.municipality())
                .island(dto.island())
                .area(dto.area())
                .areaUnit(dto.areaUnit() != null ? dto.areaUnit() : "hectares")
                .urgency(dto.urgency() != null ? dto.urgency() : Urgency.MEDIUM)
                .preferredDateFrom(dto.preferredDateFrom())
                .preferredDateTo(dto.preferredDateTo())
                .formData(dto.formData())
                .build();

        request = requestRepository.save(request);
        String clientName = getClientName(userId);

        log.info("Service request created: {} by user {}", request.getId(), userId);
        return ServiceRequestMapper.toResponse(request, clientName, 0);
    }

    @Transactional
    public ServiceRequestResponse update(Long id, UpdateServiceRequestDto dto, Long userId) {
        ServiceRequest request = findByIdOrThrow(id);
        validateOwnership(request, userId);

        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new InvalidStateException("Só é possível editar pedidos em rascunho.");
        }

        if (dto.categoryId() != null) {
            ServiceCategory category = categoryRepository.findById(dto.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));
            request.setCategory(category);
        }
        if (dto.title() != null) {
            request.setTitle(dto.title());
        }
        if (dto.description() != null) {
            request.setDescription(dto.description());
        }
        if (dto.latitude() != null && dto.longitude() != null) {
            request.setLocation(createPoint(dto.longitude(), dto.latitude()));
        }
        if (dto.parish() != null) {
            request.setParish(dto.parish());
        }
        if (dto.municipality() != null) {
            request.setMunicipality(dto.municipality());
        }
        if (dto.island() != null) {
            request.setIsland(dto.island());
        }
        if (dto.area() != null) {
            request.setArea(dto.area());
        }
        if (dto.areaUnit() != null) {
            request.setAreaUnit(dto.areaUnit());
        }
        if (dto.urgency() != null) {
            request.setUrgency(dto.urgency());
        }
        if (dto.preferredDateFrom() != null) {
            request.setPreferredDateFrom(dto.preferredDateFrom());
        }
        if (dto.preferredDateTo() != null) {
            request.setPreferredDateTo(dto.preferredDateTo());
        }
        if (dto.formData() != null) {
            request.setFormData(dto.formData());
        }

        request = requestRepository.save(request);
        String clientName = getClientName(userId);
        int proposalCount = proposalRepository.findByRequestId(id).size();

        log.info("Service request updated: {}", id);
        return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
    }

    @Transactional
    public ServiceRequestResponse publish(Long id, Long userId) {
        ServiceRequest request = findByIdOrThrow(id);
        validateOwnership(request, userId);
        validateTransition(request.getStatus(), RequestStatus.PUBLISHED);

        request.setStatus(RequestStatus.PUBLISHED);
        request.setExpiresAt(Instant.now().plus(EXPIRATION_DAYS, ChronoUnit.DAYS));
        request = requestRepository.save(request);

        String clientName = getClientName(userId);
        log.info("Service request published: {}", id);
        auditService.log(userId, "PUBLISHED", RESOURCE_SERVICE_REQUEST, id, Map.of("oldStatus", "DRAFT"), Map.of(FIELD_NEW_STATUS, "PUBLISHED"));
        return ServiceRequestMapper.toResponse(request, clientName, 0);
    }

    @Transactional
    public ServiceRequestResponse cancel(Long id, Long userId) {
        ServiceRequest request = findByIdOrThrow(id);
        validateOwnership(request, userId);

        // Only allow cancellation from states that have CANCELLED as a valid transition
        Set<RequestStatus> CANCELLABLE_STATES = Set.of(
            RequestStatus.DRAFT, RequestStatus.PUBLISHED, RequestStatus.WITH_PROPOSALS,
            RequestStatus.AWARDED, RequestStatus.IN_PROGRESS, RequestStatus.AWAITING_CONFIRMATION
        );
        if (!CANCELLABLE_STATES.contains(request.getStatus())) {
            throw new InvalidStateException("Não é possível cancelar um pedido no estado " + request.getStatus());
        }

        // If there's a held transaction, refund it
        transactionRepository.findByRequestId(id).ifPresent(tx -> {
            if (tx.getStatus() == com.agroconnect.model.enums.TransactionStatus.HELD) {
                transactionService.refund(id);
            }
        });

        request.setStatus(RequestStatus.CANCELLED);
        request = requestRepository.save(request);

        String clientName = getClientName(userId);
        int proposalCount = proposalRepository.findByRequestId(id).size();
        log.info("Service request cancelled: {}", id);
        auditService.log(userId, "CANCELLED", RESOURCE_SERVICE_REQUEST, id, null, Map.of(FIELD_NEW_STATUS, "CANCELLED"));
        return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
    }

    @Transactional
    public ServiceRequestResponse confirm(Long id, Long userId) {
        ServiceRequest request = findByIdOrThrow(id);
        validateOwnership(request, userId);
        validateTransition(request.getStatus(), RequestStatus.COMPLETED);

        request.setStatus(RequestStatus.COMPLETED);
        request = requestRepository.save(request);

        // Release the held funds to the provider
        transactionService.release(id);

        // Notify the provider
        Proposal acceptedProposal = findAcceptedProposal(id);
        notificationService.create(
                acceptedProposal.getProvider().getUser().getId(),
                "SERVICE_CONFIRMED",
                "Serviço confirmado",
                "O cliente confirmou a conclusão do serviço \"" + request.getTitle() + "\". O pagamento foi liberado.",
                JSON_REQUEST_ID_PREFIX + id + "}"
        );

        String clientName = getClientName(userId);
        int proposalCount = proposalRepository.findByRequestId(id).size();
        log.info("Service request confirmed: {}", id);
        auditService.log(userId, "COMPLETED", RESOURCE_SERVICE_REQUEST, id, Map.of("oldStatus", "AWAITING_CONFIRMATION"), Map.of(FIELD_NEW_STATUS, "COMPLETED"));
        return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
    }

    @Transactional
    public ServiceRequestResponse dispute(Long id, DisputeRequestDto dto, Long userId) {
        ServiceRequest request = findByIdOrThrow(id);
        validateOwnership(request, userId);
        validateTransition(request.getStatus(), RequestStatus.DISPUTED);

        request.setStatus(RequestStatus.DISPUTED);
        request.setDisputeReason(dto.reason());
        request = requestRepository.save(request);

        // Notify the provider
        Proposal acceptedProposal = findAcceptedProposal(id);
        notificationService.create(
                acceptedProposal.getProvider().getUser().getId(),
                "SERVICE_DISPUTED",
                "Serviço disputado",
                "O cliente abriu uma disputa para o serviço \"" + request.getTitle() + "\": " + dto.reason(),
                JSON_REQUEST_ID_PREFIX + id + "}"
        );

        String clientName = getClientName(userId);
        int proposalCount = proposalRepository.findByRequestId(id).size();
        log.info("Service request disputed: {} - reason: {}", id, dto.reason());
        auditService.log(userId, "DISPUTED", RESOURCE_SERVICE_REQUEST, id, null, Map.of(FIELD_NEW_STATUS, "DISPUTED", "reason", dto.reason()));
        return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
    }

    @Transactional
    public ServiceRequestResponse resolveDispute(Long id, ResolveDisputeDto dto) {
        ServiceRequest request = findByIdOrThrow(id);
        if (request.getStatus() != RequestStatus.DISPUTED) {
            throw new InvalidStateException("Só é possível resolver pedidos no estado DISPUTED.");
        }

        Proposal acceptedProposal = findAcceptedProposal(id);

        if (dto.resolution() == ResolveDisputeDto.Resolution.RELEASE) {
            request.setStatus(RequestStatus.COMPLETED);
            transactionService.release(id);

            notificationService.create(
                    request.getClient().getId(),
                    EVENT_DISPUTE_RESOLVED,
                    LABEL_DISPUTE_RESOLVED,
                    "A disputa foi resolvida a favor do prestador. O pagamento foi liberado.",
                    JSON_REQUEST_ID_PREFIX + id + "}"
            );
            notificationService.create(
                    acceptedProposal.getProvider().getUser().getId(),
                    EVENT_DISPUTE_RESOLVED,
                    LABEL_DISPUTE_RESOLVED,
                    "A disputa foi resolvida a seu favor. O pagamento foi liberado.",
                    JSON_REQUEST_ID_PREFIX + id + "}"
            );
        } else {
            request.setStatus(RequestStatus.CANCELLED);
            transactionService.refund(id);

            notificationService.create(
                    request.getClient().getId(),
                    EVENT_DISPUTE_RESOLVED,
                    LABEL_DISPUTE_RESOLVED,
                    "A disputa foi resolvida a seu favor. O reembolso foi processado.",
                    JSON_REQUEST_ID_PREFIX + id + "}"
            );
            notificationService.create(
                    acceptedProposal.getProvider().getUser().getId(),
                    EVENT_DISPUTE_RESOLVED,
                    LABEL_DISPUTE_RESOLVED,
                    "A disputa foi resolvida a favor do cliente. O pagamento foi reembolsado.",
                    JSON_REQUEST_ID_PREFIX + id + "}"
            );
        }

        request = requestRepository.save(request);
        String clientName = getClientName(request.getClient().getId());
        int proposalCount = proposalRepository.findByRequestId(id).size();
        log.info("Dispute resolved for request {}: {} - notes: {}", id, dto.resolution(), dto.notes());
        return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
    }

    public ServiceRequestResponse getById(Long id, Long userId) {
        ServiceRequest request = findByIdOrThrow(id);

        // DRAFT requests are private to the owner
        if (request.getStatus() == RequestStatus.DRAFT) {
            validateOwnership(request, userId);
        }

        String clientName = getClientName(request.getClient().getId());
        int proposalCount = proposalRepository.findByRequestId(id).size();
        return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
    }

    public Page<ServiceRequestSummaryResponse> listMyRequests(Long userId, RequestStatus status, Pageable pageable) {
        Page<ServiceRequest> page;
        if (status != null) {
            page = requestRepository.findByClientIdAndStatusOrderByCreatedAtDesc(userId, status, pageable);
        } else {
            page = requestRepository.findByClientIdOrderByCreatedAtDesc(userId, pageable);
        }
        return page.map(sr -> {
            int count = proposalRepository.findByRequestId(sr.getId()).size();
            return ServiceRequestMapper.toSummaryResponse(sr, count);
        });
    }

    public Page<ServiceRequestSummaryResponse> listAvailableForProvider(Long userId, Pageable pageable) {
        var providerProfile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROVIDER_PROFILE_NOT_FOUND));

        if (providerProfile.getLocation() == null) {
            throw new ValidationException("Deve definir a sua localização no perfil antes de ver pedidos disponíveis.");
        }

        double radiusMeters = providerProfile.getServiceRadiusKm() * 1000;
        Page<ServiceRequest> page = requestRepository.findAvailableForProvider(
                providerProfile.getLocation(), radiusMeters, pageable);

        return page.map(sr -> {
            int count = proposalRepository.findByRequestId(sr.getId()).size();
            return ServiceRequestMapper.toSummaryResponse(sr, count);
        });
    }

    public List<RequestPinResponse> getPinsForProvider(Long userId) {
        var provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROVIDER_PROFILE_NOT_FOUND));

        if (provider.getLocation() == null) {
            return List.of();
        }

        double radiusMeters = provider.getServiceRadiusKm() * 1000;
        List<ServiceRequest> requests = requestRepository.findPinsForProvider(
                provider.getLocation(), radiusMeters);

        return requests.stream()
                .map(sr -> new RequestPinResponse(
                        sr.getId(),
                        sr.getLocation().getY(),
                        sr.getLocation().getX(),
                        sr.getStatus(),
                        sr.getTitle(),
                        sr.getCategory().getName(),
                        sr.getUrgency(),
                        sr.getIsland()))
                .toList();
    }

    public List<RequestPinResponse> getPinsForClient(Long userId) {
        List<RequestStatus> excluded = List.of(
                RequestStatus.RATED, RequestStatus.EXPIRED,
                RequestStatus.CANCELLED, RequestStatus.DRAFT);

        List<ServiceRequest> requests = requestRepository.findByClientIdAndStatusNotIn(userId, excluded);

        return requests.stream()
                .map(sr -> new RequestPinResponse(
                        sr.getId(),
                        sr.getLocation().getY(),
                        sr.getLocation().getX(),
                        sr.getStatus(),
                        sr.getTitle(),
                        sr.getCategory().getName(),
                        sr.getUrgency(),
                        sr.getIsland()))
                .toList();
    }

    public List<ActiveJobResponse> getActiveJobsForProvider(Long userId) {
        var provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROVIDER_PROFILE_NOT_FOUND));

        var executions = executionRepository.findActiveByProviderId(provider.getId());

        return executions.stream()
                .limit(5)
                .map(e -> {
                    boolean hasAssignment = !assignmentRepository.findByExecutionId(e.getId()).isEmpty();
                    boolean hasCheckin = e.getCheckinTime() != null;
                    var request = e.getProposal().getRequest();
                    return new ActiveJobResponse(
                            e.getId(),
                            request.getId(),
                            request.getTitle(),
                            request.getCategory().getName(),
                            request.getIsland(),
                            request.getStatus(),
                            hasAssignment,
                            hasCheckin);
                })
                .toList();
    }

    public Page<ServiceRequestSummaryResponse> listAvailableForProviderFiltered(
            Long userId, String search, Long categoryId, String urgency,
            String island, Pageable pageable) {

        var providerProfile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROVIDER_PROFILE_NOT_FOUND));

        if (providerProfile.getLocation() == null) {
            throw new ValidationException("Deve definir a sua localização no perfil antes de ver pedidos disponíveis.");
        }

        double radiusMeters = providerProfile.getServiceRadiusKm() * 1000;

        Page<ServiceRequest> page = requestRepository.findAvailableForProviderFiltered(
                providerProfile.getLocation(), radiusMeters,
                search != null && !search.isBlank() ? search : null,
                categoryId, urgency, island, pageable);

        return page.map(sr -> {
            int count = proposalRepository.findByRequestId(sr.getId()).size();
            return ServiceRequestMapper.toSummaryResponse(sr, count);
        });
    }

    public PresignedUrlResponse generateUploadUrl(Long requestId, Long userId) {
        return generateUploadUrl(requestId, userId, "image/jpeg");
    }

    public PresignedUrlResponse generateUploadUrl(Long requestId, Long userId, String contentType) {
        ServiceRequest request = findByIdOrThrow(requestId);
        validateOwnership(request, userId);

        Set<RequestStatus> PHOTO_ALLOWED = Set.of(RequestStatus.DRAFT, RequestStatus.PUBLISHED);
        if (!PHOTO_ALLOWED.contains(request.getStatus())) {
            throw new InvalidStateException("Não é possível adicionar fotos neste estado.");
        }

        int currentCount = photoRepository.countByRequestId(requestId);
        if (currentCount >= MAX_PHOTOS) {
            throw new ValidationException("Número máximo de fotos atingido (" + MAX_PHOTOS + ").");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String objectKey = "requests/" + requestId + "/" + UUID.randomUUID() + extension;

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
            log.error("Failed to generate presigned URL for request {}", requestId, e);
            throw new ValidationException("Não foi possível gerar o URL de upload.");
        }
    }

    @Transactional
    public ServiceRequestResponse confirmPhotoUpload(Long requestId, String photoUrl, Long userId) {
        ServiceRequest request = findByIdOrThrow(requestId);
        validateOwnership(request, userId);

        Set<RequestStatus> PHOTO_ALLOWED = Set.of(RequestStatus.DRAFT, RequestStatus.PUBLISHED);
        if (!PHOTO_ALLOWED.contains(request.getStatus())) {
            throw new InvalidStateException("Não é possível adicionar fotos neste estado.");
        }

        // Idempotent: if this photoUrl was already confirmed, return the current state
        boolean alreadyExists = request.getPhotos().stream()
                .anyMatch(p -> photoUrl.equals(p.getPhotoUrl()));
        if (alreadyExists) {
            String clientName = getClientName(userId);
            int proposalCount = proposalRepository.findByRequestId(requestId).size();
            return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
        }

        int sortOrder = photoRepository.countByRequestId(requestId);

        RequestPhoto photo = RequestPhoto.builder()
                .request(request)
                .photoUrl(photoUrl)
                .sortOrder(sortOrder)
                .build();

        photoRepository.save(photo);

        request = requestRepository.findById(requestId).orElseThrow();
        String clientName = getClientName(userId);
        int proposalCount = proposalRepository.findByRequestId(requestId).size();

        log.info("Photo confirmed for request {}: {}", requestId, photoUrl);
        return ServiceRequestMapper.toResponse(request, clientName, proposalCount);
    }

    @Transactional
    public void deletePhoto(Long requestId, Long photoId, Long userId) {
        ServiceRequest request = findByIdOrThrow(requestId);
        validateOwnership(request, userId);

        RequestPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Foto não encontrada."));

        if (!photo.getRequest().getId().equals(requestId)) {
            throw new ForbiddenException("Esta foto não pertence a este pedido.");
        }

        photoRepository.delete(photo);
        log.info("Photo deleted from request {}: {}", requestId, photoId);
    }

    private ServiceRequest findByIdOrThrow(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de serviço não encontrado."));
    }

    private void validateOwnership(ServiceRequest request, Long userId) {
        if (!request.getClient().getId().equals(userId)) {
            throw new ForbiddenException("Não tem permissão para aceder a este pedido.");
        }
    }

    private void validateTransition(RequestStatus current, RequestStatus target) {
        Set<RequestStatus> allowed = VALID_TRANSITIONS.get(current);
        if (allowed == null || !allowed.contains(target)) {
            throw new InvalidStateException(
                    "Transição inválida de " + current + " para " + target + ".");
        }
    }

    private String getClientName(Long userId) {
        return clientProfileRepository.findByUserId(userId)
                .map(ClientProfile::getName)
                .orElse("Desconhecido");
    }

    private Proposal findAcceptedProposal(Long requestId) {
        return proposalRepository.findByRequestId(requestId).stream()
                .filter(p -> p.getStatus() == ProposalStatus.ACCEPTED)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Proposta aceite não encontrada."));
    }

    private Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }
}
