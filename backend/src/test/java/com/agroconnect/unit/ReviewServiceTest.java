package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateReviewDto;
import com.agroconnect.dto.response.ReviewResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ReviewFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
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
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.ReviewService;
import com.agroconnect.service.UserDisplayNameResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ServiceRequestRepository requestRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private NotificationService notificationService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private UserDisplayNameResolver nameResolver;

    private ReviewService service;

    private User clientUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private ClientProfile clientProfile;
    private ServiceRequest completedRequest;
    private Proposal acceptedProposal;

    @BeforeEach
    void setUp() {
        service = new ReviewService(
                reviewRepository, requestRepository, proposalRepository,
                userRepository, clientProfileRepository, providerProfileRepository,
                notificationService, eventPublisher, nameResolver);

        clientUser = UserFixture.aClientUser().build();
        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        clientProfile = UserFixture.aClientProfile().user(clientUser).build();

        completedRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.COMPLETED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        acceptedProposal = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(completedRequest).provider(providerProfile).build();
    }

    // --- create ---

    @Test
    void create_givenCompletedRequest_shouldCreateReview() {
        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho, muito profissional!");

        Review savedReview = ReviewFixture.aReview()
                .request(completedRequest).author(clientUser).target(providerUser).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 1L)).thenReturn(false);
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewRepository.countByRequestId(1L)).thenReturn(1);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        ReviewResponse response = service.create(1L, dto, 1L);

        assertNotNull(response);
        assertEquals(5, response.rating());
        verify(reviewRepository).save(any(Review.class));
        verify(notificationService).create(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void create_givenNonCompletedRequest_shouldThrowInvalidState() {
        ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.DRAFT).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho!");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));

        assertThrows(InvalidStateException.class, () -> service.create(1L, dto, 1L));
    }

    @Test
    void create_givenPublishedRequest_shouldThrowInvalidState() {
        ServiceRequest publishedRequest = ServiceRequestFixture.aPublishedRequest()
                .client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho!");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));

        assertThrows(InvalidStateException.class, () -> service.create(1L, dto, 1L));
    }

    @Test
    void create_givenInProgressRequest_shouldThrowInvalidState() {
        ServiceRequest inProgressRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.IN_PROGRESS).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        CreateReviewDto dto = new CreateReviewDto(4, "Bom trabalho realizado!");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(inProgressRequest));

        assertThrows(InvalidStateException.class, () -> service.create(1L, dto, 1L));
    }

    @Test
    void create_givenNonParticipant_shouldThrowForbidden() {
        User outsider = UserFixture.aClientUser().id(99L).email("outsider@email.pt").build();
        CreateReviewDto dto = new CreateReviewDto(3, "Tentativa de avaliação não autorizada");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(99L)).thenReturn(Optional.of(outsider));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 99L)).thenReturn(false);
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

        assertThrows(ForbiddenException.class, () -> service.create(1L, dto, 99L));
    }

    @Test
    void create_givenDuplicateReview_shouldThrowInvalidState() {
        CreateReviewDto dto = new CreateReviewDto(4, "Bom trabalho no geral");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 1L)).thenReturn(true);

        assertThrows(InvalidStateException.class, () -> service.create(1L, dto, 1L));
    }

    @Test
    void create_givenBothReviewed_shouldTransitionToRated() {
        CreateReviewDto dto = new CreateReviewDto(4, "Muito bom, recomendo este prestador!");

        Review savedReview = ReviewFixture.aReview()
                .request(completedRequest).author(clientUser).target(providerUser).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 1L)).thenReturn(false);
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewRepository.countByRequestId(1L)).thenReturn(2);
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(completedRequest);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        ReviewResponse response = service.create(1L, dto, 1L);

        assertNotNull(response);
        assertEquals(RequestStatus.RATED, completedRequest.getStatus());
        verify(requestRepository).save(any(ServiceRequest.class));
    }

    @Test
    void create_givenOnlyOneReview_shouldKeepCompleted() {
        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho, muito profissional!");

        Review savedReview = ReviewFixture.aReview()
                .request(completedRequest).author(clientUser).target(providerUser).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 1L)).thenReturn(false);
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewRepository.countByRequestId(1L)).thenReturn(1);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        service.create(1L, dto, 1L);

        assertEquals(RequestStatus.COMPLETED, completedRequest.getStatus());
        verify(requestRepository, never()).save(any(ServiceRequest.class));
    }

    @Test
    void create_givenProviderReviewingClient_shouldSucceed() {
        CreateReviewDto dto = new CreateReviewDto(4, "Cliente muito prestável e cooperativo.");

        Review savedReview = ReviewFixture.aReview()
                .request(completedRequest).author(providerUser).target(clientUser).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 2L)).thenReturn(false);
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewRepository.countByRequestId(1L)).thenReturn(1);
        when(clientProfileRepository.findByUserId(anyLong())).thenReturn(Optional.empty());
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(providerProfileRepository.findByUserId(anyLong())).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        ReviewResponse response = service.create(1L, dto, 2L);

        assertNotNull(response);
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void create_givenRatedRequest_shouldAllowReview() {
        ServiceRequest ratedRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.RATED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        Proposal ratedProposal = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(ratedRequest).provider(providerProfile).build();

        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho, muito profissional!");

        Review savedReview = ReviewFixture.aReview()
                .request(ratedRequest).author(clientUser).target(providerUser).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(ratedRequest));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 1L)).thenReturn(false);
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(ratedProposal));
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewRepository.countByRequestId(1L)).thenReturn(2);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        ReviewResponse response = service.create(1L, dto, 1L);

        assertNotNull(response);
    }

    @Test
    void create_givenShortComment_shouldThrowValidation() {
        CreateReviewDto dto = new CreateReviewDto(5, "Bom");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(reviewRepository.existsByRequestIdAndAuthorId(1L, 1L)).thenReturn(false);
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of(acceptedProposal));

        assertThrows(ValidationException.class, () -> service.create(1L, dto, 1L));
    }

    @Test
    void create_givenNonExistentRequest_shouldThrowNotFound() {
        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho!");

        when(requestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(99L, dto, 1L));
    }

    @Test
    void create_givenNonExistentUser_shouldThrowNotFound() {
        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho!");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(1L, dto, 99L));
    }

    // --- getRequestReviews ---

    @Test
    void getRequestReviews_shouldReturnAllReviews() {
        Review review1 = ReviewFixture.aReview()
                .request(completedRequest).author(clientUser).target(providerUser).build();
        Review review2 = ReviewFixture.aReview()
                .id(2L).request(completedRequest).author(providerUser).target(clientUser)
                .rating(4).comment("Bom cliente, cooperativo.").build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(completedRequest));
        when(reviewRepository.findByRequestId(1L)).thenReturn(List.of(review1, review2));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        List<ReviewResponse> reviews = service.getRequestReviews(1L);

        assertNotNull(reviews);
        assertEquals(2, reviews.size());
    }

    @Test
    void getRequestReviews_givenNonExistentRequest_shouldThrowNotFound() {
        when(requestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getRequestReviews(99L));
    }

    // --- getProviderReviews ---

    @Test
    void getProviderReviews_shouldReturnPagedReviews() {
        Review review = ReviewFixture.aReview()
                .request(completedRequest).author(clientUser).target(providerUser).build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<Review> page = new PageImpl<>(List.of(review), pageable, 1);

        when(providerProfileRepository.findById(1L)).thenReturn(Optional.of(providerProfile));
        when(reviewRepository.findByTargetIdOrderByCreatedAtDesc(2L, pageable)).thenReturn(page);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

        Page<ReviewResponse> result = service.getProviderReviews(1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("João Silva", result.getContent().get(0).authorName());
    }

    @Test
    void getProviderReviews_givenNonExistentProfile_shouldThrowNotFound() {
        when(providerProfileRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.getProviderReviews(99L, PageRequest.of(0, 10)));
    }

    // --- getMyReceivedReviews ---

    @Test
    void getMyReceivedReviews_shouldReturnReviewsForUser() {
        Review review = ReviewFixture.aReview()
                .request(completedRequest).author(providerUser).target(clientUser).build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<Review> page = new PageImpl<>(List.of(review), pageable, 1);

        when(reviewRepository.findByTargetIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        Page<ReviewResponse> result = service.getMyReceivedReviews(1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
