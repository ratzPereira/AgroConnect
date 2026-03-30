package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateListingDto;
import com.agroconnect.dto.request.UpdateListingDto;
import com.agroconnect.dto.response.ListingResponse;
import com.agroconnect.dto.response.ListingStatsResponse;
import com.agroconnect.dto.response.ListingSummaryResponse;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Listing;
import com.agroconnect.model.ListingFavorite;
import com.agroconnect.model.ListingPhoto;
import com.agroconnect.model.ProviderProfile;
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
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

        ReflectionTestUtils.setField(service, "minioBucket", "agroconnect");
        ReflectionTestUtils.setField(service, "minioEndpoint", "http://minio:9000");
        ReflectionTestUtils.setField(service, "minioPublicEndpoint", "http://localhost:9000");

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
    void create_givenValidDto_shouldCreateActiveListing() {
        CreateListingDto dto = new CreateListingDto(
                "Trator John Deere", "Trator em bom estado, 5000 horas",
                new BigDecimal("15000.00"), false, ListingCategory.EQUIPMENT,
                null, new BigDecimal("1"), "unidade",
                38.7167, -27.2167, "Angra do Heroísmo",
                "Sé", "Angra do Heroísmo", "Terceira");

        Listing savedListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        savedListing.setTitle("Trator John Deere");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(listingRepository.save(any(Listing.class))).thenReturn(savedListing);
        stubBuildFullResponse(savedListing);

        ListingResponse response = service.create(dto, 1L);

        assertNotNull(response);
        assertEquals(ListingStatus.ACTIVE, response.status());

        ArgumentCaptor<Listing> captor = ArgumentCaptor.forClass(Listing.class);
        verify(listingRepository).save(captor.capture());
        assertEquals(ListingStatus.ACTIVE, captor.getValue().getStatus());
    }

    @Test
    void create_shouldSetOwnerFromUserId() {
        CreateListingDto dto = new CreateListingDto(
                "Sementes de milho", "Lote de sementes certificadas",
                new BigDecimal("50.00"), false, ListingCategory.SEEDS,
                null, new BigDecimal("10"), "kg",
                37.7483, -25.6687, "Ponta Delgada",
                "São Sebastião", "Ponta Delgada", "São Miguel");

        Listing savedListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(listingRepository.save(any(Listing.class))).thenReturn(savedListing);
        stubBuildFullResponse(savedListing);

        service.create(dto, 1L);

        ArgumentCaptor<Listing> captor = ArgumentCaptor.forClass(Listing.class);
        verify(listingRepository).save(captor.capture());
        assertEquals(sellerUser, captor.getValue().getSeller());
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

    @Test
    void create_givenNonExistentUser_shouldThrowNotFound() {
        CreateListingDto dto = new CreateListingDto(
                "Test", "Test description",
                new BigDecimal("100.00"), false, ListingCategory.PRODUCE,
                null, null, null,
                38.0, -27.0, "Test", "Test", "Test", "Terceira");

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(dto, 999L));
    }

    // ── FIND BY ID ──

    @Test
    void getById_givenExistingId_shouldReturnResponse() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        stubBuildFullResponse(listing);

        ListingResponse response = service.findById(1L, 2L);

        assertNotNull(response);
        assertEquals(1L, response.id());
    }

    @Test
    void getById_givenNonExisting_shouldThrowNotFound() {
        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(999L, 1L));
    }

    @Test
    void getById_shouldIncrementViewsForNonOwner() {
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
    void getById_shouldNotIncrementViewsForOwner() {
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
    void getById_givenNullUserId_shouldIncrementViews() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        listing.setViewsCount(10);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        stubBuildFullResponse(listing);

        ListingResponse response = service.findById(1L, null);

        assertNotNull(response);
        assertEquals(11, response.viewsCount());
        verify(listingRepository).save(any(Listing.class));
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
    void update_givenNonOwner_shouldThrowForbidden() {
        Listing existing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        UpdateListingDto dto = new UpdateListingDto(
                "Hacked Title", null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThrows(ForbiddenException.class, () -> service.update(1L, dto, 2L));
    }

    @Test
    void update_givenNonExisting_shouldThrowNotFound() {
        UpdateListingDto dto = new UpdateListingDto(
                "Title", null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(999L, dto, 1L));
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

    @Test
    void update_givenDraftListing_shouldAllow() {
        Listing draftListing = createTestListing(1L, sellerUser, ListingStatus.DRAFT);

        UpdateListingDto dto = new UpdateListingDto(
                "Updated Draft", null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(draftListing));
        draftListing.setTitle("Updated Draft");
        when(listingRepository.save(any(Listing.class))).thenReturn(draftListing);
        stubBuildFullResponse(draftListing);

        ListingResponse response = service.update(1L, dto, 1L);

        assertNotNull(response);
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void update_givenRemovedListing_shouldThrowInvalidState() {
        Listing removedListing = createTestListing(1L, sellerUser, ListingStatus.REMOVED);

        UpdateListingDto dto = new UpdateListingDto(
                "Updated", null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(removedListing));

        assertThrows(InvalidStateException.class, () -> service.update(1L, dto, 1L));
    }

    @Test
    void update_givenExpiredListing_shouldThrowInvalidState() {
        Listing expiredListing = createTestListing(1L, sellerUser, ListingStatus.EXPIRED);

        UpdateListingDto dto = new UpdateListingDto(
                "Updated", null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(expiredListing));

        assertThrows(InvalidStateException.class, () -> service.update(1L, dto, 1L));
    }

    // ── MARK AS SOLD ──

    @Test
    void markAsSold_givenOwner_shouldSetStatusSold() {
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
    void markAsSold_givenNonOwner_shouldThrowForbidden() {
        Listing activeListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(activeListing));

        assertThrows(ForbiddenException.class, () -> service.markAsSold(1L, 2L));
    }

    @Test
    void markAsSold_givenAlreadySold_shouldThrowInvalidState() {
        Listing soldListing = createTestListing(1L, sellerUser, ListingStatus.SOLD);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(soldListing));

        assertThrows(InvalidStateException.class, () -> service.markAsSold(1L, 1L));
    }

    @Test
    void markAsSold_givenDraftListing_shouldThrowInvalidState() {
        Listing draftListing = createTestListing(1L, sellerUser, ListingStatus.DRAFT);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(draftListing));

        assertThrows(InvalidStateException.class, () -> service.markAsSold(1L, 1L));
    }

    @Test
    void markAsSold_givenNonExisting_shouldThrowNotFound() {
        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.markAsSold(999L, 1L));
    }

    // ── REMOVE ──

    @Test
    void delete_givenOwner_shouldSoftDeleteOrRemove() {
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
    void delete_givenNonOwner_shouldThrowForbidden() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));

        assertThrows(ForbiddenException.class, () -> service.remove(1L, 2L));
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
    void remove_givenNonExistingListing_shouldThrowNotFound() {
        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.remove(999L, 1L));
    }

    // ── PHOTOS ──

    @Test
    void generateUploadUrl_givenActiveListing_shouldReturnUrl() throws Exception {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingPhotoRepository.countByListingId(1L)).thenReturn(3);
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenReturn("http://minio:9000/agroconnect/listings/1/uuid.jpg");

        PresignedUrlResponse response = service.generatePhotoUploadUrl(1L, 1L);

        assertNotNull(response);
        assertNotNull(response.uploadUrl());
        assertNotNull(response.publicUrl());
    }

    @Test
    void generateUploadUrl_givenNonOwner_shouldThrowForbidden() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        assertThrows(ForbiddenException.class, () -> service.generatePhotoUploadUrl(1L, 2L));
    }

    @Test
    void generateUploadUrl_givenMaxPhotosReached_shouldThrowValidation() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingPhotoRepository.countByListingId(1L)).thenReturn(8);

        assertThrows(ValidationException.class, () -> service.generatePhotoUploadUrl(1L, 1L));
    }

    @Test
    void confirmPhoto_givenValidUrl_shouldAddPhoto() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        String photoUrl = "http://localhost:9000/agroconnect/listings/1/photo.jpg";

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingPhotoRepository.countByListingId(1L)).thenReturn(2);

        service.confirmPhotoUpload(1L, photoUrl, 1L);

        ArgumentCaptor<ListingPhoto> captor = ArgumentCaptor.forClass(ListingPhoto.class);
        verify(listingPhotoRepository).save(captor.capture());
        assertEquals(photoUrl, captor.getValue().getPhotoUrl());
        assertEquals(2, captor.getValue().getSortOrder());
        assertEquals(listing, captor.getValue().getListing());
    }

    @Test
    void confirmPhoto_givenNonOwner_shouldThrowForbidden() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        assertThrows(ForbiddenException.class,
                () -> service.confirmPhotoUpload(1L, "http://test.com/photo.jpg", 2L));
    }

    @Test
    void deletePhoto_givenOwner_shouldDelete() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        service.deletePhoto(1L, 5L, 1L);

        verify(listingPhotoRepository).deleteByListingIdAndId(1L, 5L);
    }

    @Test
    void deletePhoto_givenNonOwner_shouldThrowForbidden() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        assertThrows(ForbiddenException.class, () -> service.deletePhoto(1L, 5L, 2L));
    }

    // ── TOGGLE FAVORITE ──

    @Test
    void toggleFavorite_givenNotFavorited_shouldAddFavorite() {
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
    void toggleFavorite_givenAlreadyFavorited_shouldRemoveFavorite() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        ListingFavorite existingFav = ListingFavorite.builder()
                .id(1L).listing(listing).user(otherUser).build();

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingFavoriteRepository.findByListingIdAndUserId(1L, 2L)).thenReturn(Optional.of(existingFav));

        boolean result = service.toggleFavorite(1L, 2L);

        assertFalse(result);
        verify(listingFavoriteRepository).delete(existingFav);
    }

    @Test
    void toggleFavorite_givenNonExistingListing_shouldThrowNotFound() {
        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.toggleFavorite(999L, 2L));
    }

    @Test
    void getFavorites_shouldReturnUserFavorites() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        ListingFavorite fav = ListingFavorite.builder()
                .id(1L).listing(listing).user(otherUser).build();

        Pageable pageable = PageRequest.of(0, 20);
        Page<ListingFavorite> favPage = new PageImpl<>(List.of(fav), pageable, 1);

        when(listingFavoriteRepository.findByUserIdOrderByCreatedAtDesc(2L, pageable)).thenReturn(favPage);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.getFavorites(2L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Test Listing", result.getContent().get(0).title());
    }

    // ── SEARCH ──

    @Test
    void search_givenCategoryFilter_shouldFilterByCategory() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        listing.setCategory(ListingCategory.ANIMALS);

        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.searchActive(
                eq("ANIMALS"), eq(null), eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.search(
                "ANIMALS", null, null, null, null, null, null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void search_givenIslandFilter_shouldFilterByIsland() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        listing.setIsland("Terceira");

        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.searchActive(
                eq(null), eq("Terceira"), eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.search(
                null, "Terceira", null, null, null, null, null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Terceira", result.getContent().get(0).island());
    }

    @Test
    void search_givenPriceRange_shouldFilterByPrice() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        listing.setPrice(new BigDecimal("500.00"));

        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        BigDecimal minPrice = new BigDecimal("100.00");
        BigDecimal maxPrice = new BigDecimal("1000.00");

        when(listingRepository.searchActive(
                eq(null), eq(null), eq(null), eq(100.0), eq(1000.0),
                eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.search(
                null, null, null, minPrice, maxPrice, null, null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void search_givenRadiusFilter_shouldConvertKmToMeters() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(listingRepository.searchActive(
                eq(null), eq(null), eq(null), eq(null), eq(null),
                eq(38.7167), eq(-27.2167), eq(25000.0), eq(pageable)))
                .thenReturn(emptyPage);

        Page<ListingSummaryResponse> result = service.search(
                null, null, null, null, null, 38.7167, -27.2167, 25.0, pageable);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }

    @Test
    void search_givenNoFilters_shouldReturnAllActive() {
        Listing listing1 = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        Listing listing2 = createTestListing(2L, sellerUser, ListingStatus.ACTIVE);
        listing2.setTitle("Second Listing");

        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing1, listing2), pageable, 2);

        when(listingRepository.searchActive(
                eq(null), eq(null), eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(anyLong())).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.search(
                null, null, null, null, null, null, null, null, pageable);

        assertEquals(2, result.getTotalElements());
    }

    // ── SELLER STATS ──

    @Test
    void getSellerStats_shouldReturnCorrectCounts() {
        Listing listing1 = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        listing1.setViewsCount(10);
        Listing listing2 = createTestListing(2L, sellerUser, ListingStatus.ACTIVE);
        listing2.setViewsCount(20);

        Pageable unpaged = Pageable.unpaged();

        when(listingRepository.countBySellerIdAndStatus(1L, ListingStatus.ACTIVE)).thenReturn(5L);
        when(listingRepository.countBySellerIdAndStatus(1L, ListingStatus.SOLD)).thenReturn(3L);
        when(listingRepository.findBySellerIdOrderByCreatedAtDesc(1L, unpaged))
                .thenReturn(new PageImpl<>(List.of(listing1, listing2)));
        when(listingConversationRepository.findSellerInbox(1L, unpaged))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        ListingStatsResponse stats = service.getSellerStats(1L);

        assertNotNull(stats);
        assertEquals(5L, stats.activeCount());
        assertEquals(3L, stats.soldCount());
        assertEquals(30L, stats.totalViews());
        assertEquals(0L, stats.totalConversations());
    }

    // ── FIND BY SELLER ──

    @Test
    void findBySeller_givenStatus_shouldFilterByStatus() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.findBySellerIdAndStatusOrderByCreatedAtDesc(1L, ListingStatus.ACTIVE, pageable))
                .thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.findBySeller(1L, "ACTIVE", pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findBySeller_givenNoStatus_shouldReturnAll() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.findBySellerIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.findBySeller(1L, null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    // ── EXPIRE LISTINGS ──

    @Test
    void expireListings_shouldSetStatusExpiredAndNotify() {
        Listing expirableListing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findExpiredActive(any(Instant.class))).thenReturn(List.of(expirableListing));
        when(listingRepository.save(any(Listing.class))).thenReturn(expirableListing);

        service.expireListings();

        verify(listingRepository).save(any(Listing.class));
        verify(notificationService).create(
                eq(1L), eq("LISTING_EXPIRED"), anyString(), anyString(), anyString());
    }

    @Test
    void expireListings_givenNoExpired_shouldNotNotify() {
        when(listingRepository.findExpiredActive(any(Instant.class))).thenReturn(Collections.emptyList());

        service.expireListings();

        verify(listingRepository, never()).save(any(Listing.class));
        verify(notificationService, never()).create(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    // ── UPDATE ALL FIELDS ──

    @Test
    void update_givenAllFields_shouldUpdateEveryField() {
        Listing existing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        UpdateListingDto dto = new UpdateListingDto(
                "New Title", "New Desc", new BigDecimal("500.00"),
                true, ListingCategory.EQUIPMENT, null,
                new BigDecimal("5"), "toneladas",
                38.72, -27.22, "Nova Localização",
                "Altares", "Angra do Heroísmo", "Terceira");

        when(listingRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(listingRepository.save(any(Listing.class))).thenReturn(existing);
        stubBuildFullResponse(existing);

        ListingResponse response = service.update(1L, dto, 1L);

        assertNotNull(response);
        assertEquals("New Title", existing.getTitle());
        assertEquals("New Desc", existing.getDescription());
        assertEquals(new BigDecimal("500.00"), existing.getPrice());
        assertTrue(existing.isPriceNegotiable());
        assertEquals(ListingCategory.EQUIPMENT, existing.getCategory());
        assertEquals(new BigDecimal("5"), existing.getQuantity());
        assertEquals("toneladas", existing.getUnit());
        assertEquals("Nova Localização", existing.getLocationName());
        assertEquals("Altares", existing.getParish());
        assertEquals("Angra do Heroísmo", existing.getMunicipality());
        assertEquals("Terceira", existing.getIsland());
        assertNotNull(existing.getLocation());
    }

    @Test
    void update_givenOnlyLatitude_shouldNotUpdateLocation() {
        Listing existing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        Point originalLocation = existing.getLocation();
        UpdateListingDto dto = new UpdateListingDto(
                null, null, null, null, null, null,
                null, null, 38.72, null,
                null, null, null, null);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(listingRepository.save(any(Listing.class))).thenReturn(existing);
        stubBuildFullResponse(existing);

        service.update(1L, dto, 1L);

        // Location should not change since longitude is null
        assertEquals(originalLocation, existing.getLocation());
    }

    // ── REMOVE EDGE CASES ──

    @Test
    void remove_givenNonExistentUser_shouldThrowNotFound() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.remove(1L, 999L));
    }

    // ── PHOTO UPLOAD MINIO ERROR ──

    @Test
    void generateUploadUrl_givenMinioFailure_shouldThrowValidation() throws Exception {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingPhotoRepository.countByListingId(1L)).thenReturn(0);
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenThrow(new RuntimeException("MinIO connection error"));

        assertThrows(ValidationException.class, () -> service.generatePhotoUploadUrl(1L, 1L));
    }

    // ── FIND BY SELLER EDGE CASES ──

    @Test
    void findBySeller_givenBlankStatus_shouldReturnAll() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.findBySellerIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());

        Page<ListingSummaryResponse> result = service.findBySeller(1L, "  ", pageable);

        assertEquals(1, result.getTotalElements());
        verify(listingRepository).findBySellerIdOrderByCreatedAtDesc(1L, pageable);
    }

    // ── DISPLAY NAME FALLBACKS ──

    @Test
    void buildFullResponse_givenProviderSeller_shouldUseCompanyName() {
        User providerUser = createTestUser(5L, Role.PROVIDER_MANAGER);
        Listing listing = createTestListing(1L, providerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        when(clientProfileRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(5L)).thenReturn(Optional.of(
                ProviderProfile.builder()
                        .id(1L).companyName("AgroServiços").build()));
        when(reviewRepository.findAverageRatingByTargetId(5L)).thenReturn(null);
        when(listingRepository.countBySellerIdAndStatus(5L, ListingStatus.ACTIVE)).thenReturn(1L);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());
        when(listingFavoriteRepository.countByListingId(1L)).thenReturn(0L);

        ListingResponse response = service.findById(1L, 2L);

        assertNotNull(response);
        assertEquals("AgroServiços", response.sellerName());
    }

    @Test
    void buildFullResponse_givenNoProfile_shouldUseDefaultName() {
        User orphanUser = createTestUser(7L, Role.CLIENT);
        Listing listing = createTestListing(1L, orphanUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        when(clientProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());
        when(reviewRepository.findAverageRatingByTargetId(7L)).thenReturn(null);
        when(listingRepository.countBySellerIdAndStatus(7L, ListingStatus.ACTIVE)).thenReturn(0L);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(Collections.emptyList());
        when(listingFavoriteRepository.countByListingId(1L)).thenReturn(0L);

        ListingResponse response = service.findById(1L, 2L);

        assertNotNull(response);
        assertEquals("Utilizador", response.sellerName());
    }

    @Test
    void buildFullResponse_givenNullCurrentUser_shouldNotCheckFavorited() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);
        stubBuildFullResponse(listing);

        ListingResponse response = service.findById(1L, null);

        assertNotNull(response);
        assertFalse(response.favorited());
        // Should never call existsByListingIdAndUserId when currentUserId is null
        verify(listingFavoriteRepository, never()).existsByListingIdAndUserId(anyLong(), anyLong());
    }

    // ── SEARCH WITH PHOTOS ──

    @Test
    void search_givenListingWithPhotos_shouldReturnFirstPhotoUrl() {
        Listing listing = createTestListing(1L, sellerUser, ListingStatus.ACTIVE);
        ListingPhoto photo = ListingPhoto.builder()
                .id(1L).listing(listing).photoUrl("http://localhost:9000/photo1.jpg").sortOrder(0).build();

        Pageable pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.searchActive(
                eq(null), eq(null), eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(page);
        when(listingPhotoRepository.findByListingIdOrderBySortOrderAsc(1L)).thenReturn(List.of(photo));

        Page<ListingSummaryResponse> result = service.search(
                null, null, null, null, null, null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("http://localhost:9000/photo1.jpg", result.getContent().get(0).firstPhotoUrl());
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
