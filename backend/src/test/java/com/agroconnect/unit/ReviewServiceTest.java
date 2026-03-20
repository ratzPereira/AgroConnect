package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateReviewDto;
import com.agroconnect.dto.response.ReviewResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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
                notificationService);

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

    @Test
    void create_givenClientReviewingProvider_shouldSucceed() {
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
        verify(notificationService).create(anyLong(), anyString(), anyString(), anyString());
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
    void create_givenDraftRequest_shouldThrowInvalidState() {
        ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.DRAFT).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();

        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho!");

        when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));

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
        when(reviewRepository.countByRequestId(1L)).thenReturn(2); // Both reviewed
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(completedRequest);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        ReviewResponse response = service.create(1L, dto, 1L);

        assertNotNull(response);
        verify(requestRepository).save(any(ServiceRequest.class));
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
        // updateProviderRatingIfNeeded calls findByUserId for target (clientUser.id=1L)
        when(providerProfileRepository.findByUserId(anyLong())).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        ReviewResponse response = service.create(1L, dto, 2L);

        assertNotNull(response);
        verify(reviewRepository).save(any(Review.class));
    }
}
