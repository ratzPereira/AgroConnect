package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateListingDto;
import com.agroconnect.dto.request.UpdateListingDto;
import com.agroconnect.dto.response.ListingResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Listing;
import com.agroconnect.model.ListingFavorite;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingStatus;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ListingConversationRepository;
import com.agroconnect.repository.ListingFavoriteRepository;
import com.agroconnect.repository.ListingPhotoRepository;
import com.agroconnect.repository.ListingRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ReviewRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.ListingService;
import com.agroconnect.service.NotificationService;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Mock private ListingRepository listingRepository;
    @Mock private ListingPhotoRepository listingPhotoRepository;
    @Mock private ListingFavoriteRepository listingFavoriteRepository;
    @Mock private ListingConversationRepository listingConversationRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private NotificationService notificationService;
    @Mock private MinioClient minioClient;

    private ListingService service;

    private User sellerUser;
    private User otherUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        service = new ListingService(
                listingRepository, listingPhotoRepository, listingFavoriteRepository,
                listingConversationRepository, userRepository, clientProfileRepository,
                providerProfileRepository, reviewRepository, notificationService, minioClient);

        sellerUser = createTestUser(1L, Role.CLIENT);
        otherUser = createTestUser(2L, Role.CLIENT);
        adminUser = createTestUser(99L, Role.ADMIN);
    }

    // ── CREATE ──

    @Test
    void create_givenValidData_shouldReturnListingResponse() {
        CreateListingDto dto = new CreateListingDto(
                "Vitelos Holstein", "3 vitelos com 6 meses, vacinados",
                new BigDecimal("1200.00"), false, ListingCategory.ANIMALS,
                null, new BigDecimal("3"), "cabeças",
                38.6553, -27.2167, "Angra do Heroísmo",
                "Sé", "Angra do Heroísmo", "Terceira");

        Listing savedListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        savedListing.setTitle("Vitelos Holstein");
        savedListing.setPrice(new BigDecimal("1200.00"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(listingRepository.save(any(Listing.class))).thenReturn(savedListing);
        stubBuildFullResponse(savedListing);

        ListingResponse response = service.create(dto, 1L);

        assertNotNull(response);
        assertEquals("Vitelos Holstein", response.title());
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void create_givenNullPrice_shouldAllowPriceOnRequest() {
        CreateListingDto dto = new CreateListingDto(
                "Mudas de pitaya", "Mudas orgânicas de pitaya",
                null, true, ListingCategory.PLANTS,
                null, new BigDecimal("20"), "mudas",
                37.7483, -25.6687, "Ponta Delgada",
                "São Sebastião", "Ponta Delgada", "São Miguel");

        Listing savedListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        savedListing.setTitle("Mudas de pitaya");
        savedListing.setPrice(null);
        savedListing.setPriceNegotiable(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(listingRepository.save(any(Listing.class))).thenReturn(savedListing);
        stubBuildFullResponse(savedListing);

        ListingResponse response = service.create(dto, 1L);

        assertNotNull(response);
        assertTrue(response.priceNegotiable());
    }

    // ── UPDATE ──

    @Test
    void update_givenOwner_shouldUpdateFields() {
        Listing existing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        UpdateListingDto dto = new UpdateListingDto(
                "Updated Title", null, new BigDecimal("999.00"),
                null, null, null, null, null,
                null, null, null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(existing));
        existing.setTitle("Updated Title");
        existing.setPrice(new BigDecimal("999.00"));
        when(listingRepository.save(any(Listing.class))).thenReturn(existing);
        stubBuildFullResponse(existing);

        ListingResponse response = service.update(1L, dto, 1L);

        assertNotNull(response);
        assertEquals("Updated Title", response.title());
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void update_givenNotOwner_shouldThrowForbidden() {
        Listing existing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        UpdateListingDto dto = new UpdateListingDto(
                "Hacked Title", null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThrows(ForbiddenException.class, () -> service.update(1L, dto, 2L));
    }

    @Test
    void update_givenSoldListing_shouldThrowInvalidState() {
        Listing soldListing = createTestListing(1L, sellerUser, ListingStatus.SOLD);

        UpdateListingDto dto = new UpdateListingDto(
                "Updated", null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(soldListing));

        assertThrows(InvalidStateException.class, () -> service.update(1L, dto, 1L));
    }

    // ── MARK AS SOLD ──

    @Test
    void markAsSold_givenActiveListing_shouldChangeToSold() {
        Listing activeListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(activeListing));
        when(listingRepository.save(any(Listing.class))).thenReturn(activeListing);
        stubBuildFullResponse(activeListing);

        ListingResponse response = service.markAsSold(1L, 1L);

        assertNotNull(response);
        assertEquals(ListingStatus.SOLD, response.status());
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void markAsSold_givenNotOwner_shouldThrowForbidden() {
        Listing activeListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(activeListing));

        assertThrows(ForbiddenException.class, () -> service.markAsSold(1L, 2L));
    }

    @Test
    void markAsSold_givenNotActiveListing_shouldThrowInvalidState() {
        Listing draftListing = createTestListing(1L, sellerUser, ListingStatus.DRAFT);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(draftListing));

        assertThrows(InvalidStateException.class, () -> service.markAsSold(1L, 1L));
    }

    // ── REMOVE ──

    @Test
    void remove_givenOwner_shouldChangeToRemoved() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        listing.setStatus(ListingStatus.REMOVED);
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        stubBuildFullResponse(listing);

        ListingResponse response = service.remove(1L, 1L);

        assertNotNull(response);
        assertEquals(ListingStatus.REMOVED, response.status());
    }

    @Test
    void remove_givenAdmin_shouldAllowRemoval() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(userRepository.findById(99L)).thenReturn(Optional.of(adminUser));
        listing.setStatus(ListingStatus.REMOVED);
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        stubBuildFullResponse(listing);

        ListingResponse response = service.remove(1L, 99L);

        assertNotNull(response);
        assertEquals(ListingStatus.REMOVED, response.status());
    }

    @Test
    void remove_givenNonOwnerNonAdmin_shouldThrowForbidden() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));

        assertThrows(ForbiddenException.class, () -> service.remove(1L, 2L));
    }

    // ── TOGGLE FAVORITE ──

    @Test
    void toggleFavorite_givenNotFavorited_shouldAddAndReturnTrue() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingFavoriteRepository.findByListingIdAndUserId(1L, 2L)).thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
        when(listingFavoriteRepository.save(any(ListingFavorite.class)))
                .thenReturn(ListingFavorite.builder().id(1L).listing(listing).user(otherUser).build());

        boolean result = service.toggleFavorite(1L, 2L);

        assertTrue(result);
        verify(listingFavoriteRepository).save(any(ListingFavorite.class));
    }

    @Test
    void toggleFavorite_givenAlreadyFavorited_shouldRemoveAndReturnFalse() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        ListingFavorite existingFav = ListingFavorite.builder()
                .id(1L).listing(listing).user(otherUser).build();

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingFavoriteRepository.findByListingIdAndUserId(1L, 2L)).thenReturn(Optional.of(existingFav));

        boolean result = service.toggleFavorite(1L, 2L);

        assertFalse(result);
        verify(listingFavoriteRepository).delete(existingFav);
    }

    // ── FIND BY ID ──

    @Test
    void findById_givenNonOwnerView_shouldIncrementViewCount() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        listing.setViewsCount(5);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        stubBuildFullResponse(listing);

        ListingResponse response = service.findById(1L, 2L);

        assertNotNull(response);
        assertEquals(6, response.viewsCount());
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void findById_givenOwnerView_shouldNotIncrementViewCount() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        listing.setViewsCount(5);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        stubBuildFullResponse(listing);

        ListingResponse response = service.findById(1L, 1L);

        assertNotNull(response);
        assertEquals(5, response.viewsCount());
        verify(listingRepository, never()).save(any(Listing.class));
    }

    @Test
    void findById_givenNonExistent_shouldThrowNotFound() {
        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(999L, 1L));
    }

    // ── Helper methods ──

    private User createTestUser(Long id, Role role) {
        return User.builder()
                .id(id)
                .email("user" + id + "@test.com")
                .passwordHash("$2a$12$hashedpassword")
                .role(role)
                .emailVerified(true)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private Listing createTestListing(Long id, User seller, ListingStatus status) {
        Point location = GF.createPoint(new Coordinate(-25.67, 37.74));
        location.setSRID(4326);
        return Listing.builder()
                .id(id)
                .seller(seller)
                .title("Test Listing")
                .description("Test description")
                .category(ListingCategory.PRODUCE)
                .price(new BigDecimal("100.00"))
                .priceNegotiable(false)
                .status(status)
                .location(location)
                .locationName("Ponta Delgada")
                .parish("São Sebastião")
                .municipality("Ponta Delgada")
                .island("São Miguel")
                .viewsCount(0)
                .photos(new ArrayList<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(7776000))
                .build();
    }

    /**
     * Stubs all the repository calls needed by buildFullResponse inside ListingService.
     */
    private void stubBuildFullResponse(Listing listing) {
        Long sellerId = listing.getSeller().getId();
        ClientProfile cp = ClientProfile.builder().id(sellerId).name("Test Seller").build();
        when(clientProfileRepository.findByUserId(sellerId)).thenReturn(Optional.of(cp));
        when(reviewRepository.findAverageRatingByTargetId(sellerId)).thenReturn(4.5);
        when(listingRepository.countBySellerIdAndStatus(sellerId, ListingStatus.ACTIVE)).thenReturn(3L);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(listing.getId()))
                .thenReturn(Collections.emptyList());
        when(listingFavoriteRepository.countByListingId(listing.getId())).thenReturn(2L);
    }
}
