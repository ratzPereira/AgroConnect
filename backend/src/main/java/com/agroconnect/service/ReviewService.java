package com.agroconnect.service;

import com.agroconnect.dto.request.CreateReviewDto;
import com.agroconnect.dto.response.ReviewResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.mapper.ReviewMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Review;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ReviewRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private static final Set<RequestStatus> REVIEWABLE_STATUSES = EnumSet.of(
            RequestStatus.COMPLETED, RequestStatus.RATED);

    private final ReviewRepository reviewRepository;
    private final ServiceRequestRepository requestRepository;
    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final UserDisplayNameResolver nameResolver;

    @Transactional
    public ReviewResponse create(Long requestId, CreateReviewDto dto, Long userId) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de serviço não encontrado."));

        if (!REVIEWABLE_STATUSES.contains(request.getStatus())) {
            throw new InvalidStateException("Só é possível avaliar pedidos no estado COMPLETED ou RATED.");
        }

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        if (reviewRepository.existsByRequestIdAndAuthorId(requestId, userId)) {
            throw new InvalidStateException("Já submeteu uma avaliação para este pedido.");
        }

        // Determine target: if author is client → target is provider, and vice-versa
        Proposal acceptedProposal = findAcceptedProposal(requestId);
        Long clientId = request.getClient().getId();
        Long providerUserId = acceptedProposal.getProvider().getUser().getId();

        User target;
        if (clientId.equals(userId)) {
            target = acceptedProposal.getProvider().getUser();
        } else if (providerUserId.equals(userId)) {
            target = request.getClient();
        } else {
            throw new ForbiddenException("Apenas participantes do serviço podem avaliar.");
        }

        if (dto.comment().length() < 10) {
            throw new ValidationException("O comentário deve ter pelo menos 10 caracteres.");
        }

        Review review = Review.builder()
                .request(request)
                .author(author)
                .target(target)
                .rating(dto.rating())
                .comment(dto.comment())
                .build();

        review = reviewRepository.save(review);

        // Update provider avg rating if target is provider
        updateProviderRatingIfNeeded(target.getId());

        // Check if both parties have reviewed → transition to RATED
        int reviewCount = reviewRepository.countByRequestId(requestId);
        if (reviewCount >= 2 && request.getStatus() == RequestStatus.COMPLETED) {
            request.setStatus(RequestStatus.RATED);
            requestRepository.save(request);
            log.info("Request {} transitioned to RATED (both parties reviewed)", requestId);
        }

        // Notify target
        String authorName = getDisplayName(userId);
        notificationService.create(
                target.getId(),
                "NEW_REVIEW",
                "Nova avaliação recebida",
                authorName + " deixou uma avaliação para o serviço \"" + request.getTitle() + "\".",
                "{\"requestId\":" + requestId + "}"
        );

        String targetName = getDisplayName(target.getId());

        eventPublisher.publishEvent(new com.agroconnect.event.RatingReceivedEvent(
                review.getId(),
                review.getAuthor().getId(),
                review.getTarget().getId(),
                review.getTarget().getEmail(),
                nameResolver.resolve(review.getTarget()),
                nameResolver.resolve(review.getAuthor()),
                review.getRating(),
                review.getComment(),
                Instant.now()));

        log.info("Review created: {} by user {} for user {} on request {}",
                review.getId(), userId, target.getId(), requestId);
        return ReviewMapper.toResponse(review, authorName, targetName);
    }

    public Page<ReviewResponse> getProviderReviews(Long providerProfileId, Pageable pageable) {
        ProviderProfile provider = providerProfileRepository.findById(providerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));

        return reviewRepository.findByTargetIdOrderByCreatedAtDesc(provider.getUser().getId(), pageable)
                .map(review -> ReviewMapper.toResponse(review,
                        getDisplayName(review.getAuthor().getId()),
                        provider.getCompanyName()));
    }

    public java.util.List<ReviewResponse> getRequestReviews(Long requestId) {
        requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de serviço não encontrado."));

        return reviewRepository.findByRequestId(requestId).stream()
                .map(review -> ReviewMapper.toResponse(review,
                        getDisplayName(review.getAuthor().getId()),
                        getDisplayName(review.getTarget().getId())))
                .toList();
    }

    public Page<ReviewResponse> getMyReceivedReviews(Long userId, Pageable pageable) {
        return reviewRepository.findByTargetIdOrderByCreatedAtDesc(userId, pageable)
                .map(review -> ReviewMapper.toResponse(review,
                        getDisplayName(review.getAuthor().getId()),
                        getDisplayName(review.getTarget().getId())));
    }

    private Proposal findAcceptedProposal(Long requestId) {
        return proposalRepository.findByRequestId(requestId).stream()
                .filter(p -> p.getStatus() == ProposalStatus.ACCEPTED)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Proposta aceite não encontrada."));
    }

    private void updateProviderRatingIfNeeded(Long userId) {
        providerProfileRepository.findByUserId(userId).ifPresent(provider -> {
            Double avg = reviewRepository.findAverageRatingByTargetId(userId);
            int count = reviewRepository.countByTargetId(userId);
            if (avg != null) {
                provider.setAvgRating(avg);
                provider.setTotalReviews(count);
                providerProfileRepository.save(provider);
            }
        });
    }

    private String getDisplayName(Long userId) {
        return clientProfileRepository.findByUserId(userId)
                .map(ClientProfile::getName)
                .orElseGet(() -> providerProfileRepository.findByUserId(userId)
                        .map(ProviderProfile::getCompanyName)
                        .orElse("Utilizador"));
    }
}
