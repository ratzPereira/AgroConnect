package com.agroconnect.service;

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
import com.agroconnect.mapper.ListingMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Listing;
import com.agroconnect.model.ListingFavorite;
import com.agroconnect.model.ListingPhoto;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListingService {

    private static final Logger log = LoggerFactory.getLogger(ListingService.class);

    private static final int PRESIGNED_URL_EXPIRY_MINUTES = 15;
    private static final int SRID_WGS84 = 4326;
    private static final int MAX_PHOTOS = 8;
    private static final int LISTING_EXPIRY_DAYS = 90;
    private static final double KM_TO_METERS = 1000.0;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);
    private static final Set<ListingStatus> EDITABLE_STATUSES = EnumSet.of(ListingStatus.ACTIVE, ListingStatus.DRAFT);
    private static final String ERR_USER_NOT_FOUND = "Utilizador não encontrado.";

    private final ListingRepository listingRepository;
    private final ListingPhotoRepository listingPhotoRepository;
    private final ListingFavoriteRepository listingFavoriteRepository;
    private final ListingConversationRepository listingConversationRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final MinioClient minioClient;

    @Value("${agroconnect.minio.bucket}")
    private String minioBucket;

    @Value("${agroconnect.minio.endpoint}")
    private String minioEndpoint;

    @Value("${agroconnect.minio.public-endpoint}")
    private String minioPublicEndpoint;

    @Transactional
    public ListingResponse create(CreateListingDto dto, Long userId) {
        User seller = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));

        Point location = buildPoint(dto.latitude(), dto.longitude());

        Listing listing = Listing.builder()
                .seller(seller)
                .category(dto.category())
                .title(dto.title())
                .description(dto.description())
                .price(dto.price())
                .priceNegotiable(dto.priceNegotiable())
                .condition(dto.condition())
                .quantity(dto.quantity())
                .unit(dto.unit())
                .location(location)
                .locationName(dto.locationName())
                .parish(dto.parish())
                .municipality(dto.municipality())
                .island(dto.island())
                .status(ListingStatus.ACTIVE)
                .expiresAt(Instant.now().plus(LISTING_EXPIRY_DAYS, ChronoUnit.DAYS))
                .build();

        listing = listingRepository.save(listing);

        log.info("Listing {} created by user {}", listing.getId(), userId);

        return buildFullResponse(listing, userId);
    }

    @Transactional
    public ListingResponse update(Long id, UpdateListingDto dto, Long userId) {
        Listing listing = findByIdOrThrow(id);
        validateOwnership(listing, userId);

        if (!EDITABLE_STATUSES.contains(listing.getStatus())) {
            throw new InvalidStateException("Só é possível editar anúncios com estado ACTIVE ou DRAFT.");
        }

        if (dto.title() != null) {
            listing.setTitle(dto.title());
        }
        if (dto.description() != null) {
            listing.setDescription(dto.description());
        }
        if (dto.price() != null) {
            listing.setPrice(dto.price());
        }
        if (dto.priceNegotiable() != null) {
            listing.setPriceNegotiable(dto.priceNegotiable());
        }
        if (dto.category() != null) {
            listing.setCategory(dto.category());
        }
        if (dto.condition() != null) {
            listing.setCondition(dto.condition());
        }
        if (dto.quantity() != null) {
            listing.setQuantity(dto.quantity());
        }
        if (dto.unit() != null) {
            listing.setUnit(dto.unit());
        }
        if (dto.latitude() != null && dto.longitude() != null) {
            listing.setLocation(buildPoint(dto.latitude(), dto.longitude()));
        }
        if (dto.locationName() != null) {
            listing.setLocationName(dto.locationName());
        }
        if (dto.parish() != null) {
            listing.setParish(dto.parish());
        }
        if (dto.municipality() != null) {
            listing.setMunicipality(dto.municipality());
        }
        if (dto.island() != null) {
            listing.setIsland(dto.island());
        }

        listing = listingRepository.save(listing);

        log.info("Listing {} updated by user {}", id, userId);

        return buildFullResponse(listing, userId);
    }

    @Transactional
    public ListingResponse markAsSold(Long id, Long userId) {
        Listing listing = findByIdOrThrow(id);
        validateOwnership(listing, userId);

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new InvalidStateException("Só é possível marcar como vendido anúncios com estado ACTIVE.");
        }

        listing.setStatus(ListingStatus.SOLD);
        listing = listingRepository.save(listing);

        log.info("Listing {} marked as sold by user {}", id, userId);

        return buildFullResponse(listing, userId);
    }

    @Transactional
    public ListingResponse remove(Long id, Long userId) {
        Listing listing = findByIdOrThrow(id);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));

        boolean isOwner = listing.getSeller().getId().equals(userId);
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Não tem permissão para remover este anúncio.");
        }

        listing.setStatus(ListingStatus.REMOVED);
        listing = listingRepository.save(listing);

        log.info("Listing {} removed by user {} (admin={})", id, userId, isAdmin);

        return buildFullResponse(listing, userId);
    }

    @Transactional
    public ListingResponse findById(Long id, Long currentUserId) {
        Listing listing = findByIdOrThrow(id);

        // Increment views if not the seller viewing their own listing
        if (currentUserId == null || !listing.getSeller().getId().equals(currentUserId)) {
            listing.setViewsCount(listing.getViewsCount() + 1);
            listing = listingRepository.save(listing);
        }

        return buildFullResponse(listing, currentUserId);
    }

    public Page<ListingSummaryResponse> search(String category,
                                                String island,
                                                String query,
                                                BigDecimal minPrice,
                                                BigDecimal maxPrice,
                                                Double lat,
                                                Double lng,
                                                Double radiusKm,
                                                Pageable pageable) {
        Double minPriceDouble = minPrice != null ? minPrice.doubleValue() : null;
        Double maxPriceDouble = maxPrice != null ? maxPrice.doubleValue() : null;
        Double radiusMeters = radiusKm != null ? radiusKm * KM_TO_METERS : null;

        Page<Listing> page = listingRepository.searchActive(
                category, island, query, minPriceDouble, maxPriceDouble,
                lat, lng, radiusMeters, pageable);

        return page.map(listing -> {
            String firstPhoto = getFirstPhotoUrl(listing.getId());
            return ListingMapper.toSummaryResponse(listing, firstPhoto);
        });
    }

    public Page<ListingSummaryResponse> findBySeller(Long userId, String status, Pageable pageable) {
        Page<Listing> page;

        if (status != null && !status.isBlank()) {
            ListingStatus listingStatus = ListingStatus.valueOf(status.toUpperCase());
            page = listingRepository.findBySellerIdAndStatusOrderByCreatedAtDesc(userId, listingStatus, pageable);
        } else {
            page = listingRepository.findBySellerIdOrderByCreatedAtDesc(userId, pageable);
        }

        return page.map(listing -> {
            String firstPhoto = getFirstPhotoUrl(listing.getId());
            return ListingMapper.toSummaryResponse(listing, firstPhoto);
        });
    }

    public ListingStatsResponse getSellerStats(Long userId) {
        long activeCount = listingRepository.countBySellerIdAndStatus(userId, ListingStatus.ACTIVE);
        long soldCount = listingRepository.countBySellerIdAndStatus(userId, ListingStatus.SOLD);

        // Sum views from seller's listings
        Page<Listing> allListings = listingRepository.findBySellerIdOrderByCreatedAtDesc(userId, Pageable.unpaged());
        long totalViews = allListings.getContent().stream()
                .mapToLong(Listing::getViewsCount)
                .sum();

        long totalConversations = listingConversationRepository.findSellerInbox(userId, Pageable.unpaged())
                .getTotalElements();

        return new ListingStatsResponse(activeCount, soldCount, totalViews, totalConversations);
    }

    public PresignedUrlResponse generatePhotoUploadUrl(Long listingId, Long userId) {
        Listing listing = findByIdOrThrow(listingId);
        validateOwnership(listing, userId);

        int currentPhotoCount = listingPhotoRepository.countByListingId(listingId);
        if (currentPhotoCount >= MAX_PHOTOS) {
            throw new ValidationException("O número máximo de fotos (" + MAX_PHOTOS + ") foi atingido.");
        }

        String objectKey = "listings/" + listingId + "/" + UUID.randomUUID() + ".jpg";

        try {
            String uploadUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(minioBucket)
                            .object(objectKey)
                            .expiry(PRESIGNED_URL_EXPIRY_MINUTES, TimeUnit.MINUTES)
                            .build());

            uploadUrl = uploadUrl.replace(minioEndpoint, minioPublicEndpoint);
            String publicUrl = minioPublicEndpoint + "/" + minioBucket + "/" + objectKey;

            return new PresignedUrlResponse(uploadUrl, objectKey, publicUrl);
        } catch (Exception e) {
            log.error("Failed to generate presigned URL for listing {}", listingId, e);
            throw new ValidationException("Não foi possível gerar o URL de upload.");
        }
    }

    @Transactional
    public void confirmPhotoUpload(Long listingId, String photoUrl, Long userId) {
        Listing listing = findByIdOrThrow(listingId);
        validateOwnership(listing, userId);

        int nextSortOrder = listingPhotoRepository.countByListingId(listingId);

        ListingPhoto photo = ListingPhoto.builder()
                .listing(listing)
                .photoUrl(photoUrl)
                .sortOrder(nextSortOrder)
                .build();

        listingPhotoRepository.save(photo);

        log.info("Photo confirmed for listing {}: {}", listingId, photoUrl);
    }

    @Transactional
    public void deletePhoto(Long listingId, Long photoId, Long userId) {
        Listing listing = findByIdOrThrow(listingId);
        validateOwnership(listing, userId);

        listingPhotoRepository.deleteByListingIdAndId(listingId, photoId);

        log.info("Photo {} deleted from listing {} by user {}", photoId, listingId, userId);
    }

    @Transactional
    public boolean toggleFavorite(Long listingId, Long userId) {
        Listing listing = findByIdOrThrow(listingId);

        return listingFavoriteRepository.findByListingIdAndUserId(listingId, userId)
                .map(existing -> {
                    listingFavoriteRepository.delete(existing);
                    log.debug("User {} unfavorited listing {}", userId, listingId);
                    return false;
                })
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));

                    ListingFavorite favorite = ListingFavorite.builder()
                            .listing(listing)
                            .user(user)
                            .build();

                    listingFavoriteRepository.save(favorite);
                    log.debug("User {} favorited listing {}", userId, listingId);
                    return true;
                });
    }

    public Page<ListingSummaryResponse> getFavorites(Long userId, Pageable pageable) {
        return listingFavoriteRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(fav -> {
                    Listing listing = fav.getListing();
                    String firstPhoto = getFirstPhotoUrl(listing.getId());
                    return ListingMapper.toSummaryResponse(listing, firstPhoto);
                });
    }

    @Transactional
    public void expireListings() {
        List<Listing> expired = listingRepository.findExpiredActive(Instant.now());
        for (Listing listing : expired) {
            listing.setStatus(ListingStatus.EXPIRED);
            listingRepository.save(listing);
            log.info("Listing {} expired", listing.getId());

            notificationService.create(
                    listing.getSeller().getId(),
                    "LISTING_EXPIRED",
                    "Anúncio expirado",
                    "O seu anúncio \"" + listing.getTitle() + "\" expirou. Pode republicá-lo se desejar.",
                    "{\"listingId\":" + listing.getId() + "}"
            );
        }

        if (!expired.isEmpty()) {
            log.info("Expired {} listings", expired.size());
        }
    }

    private Listing findByIdOrThrow(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado."));
    }

    private void validateOwnership(Listing listing, Long userId) {
        if (!listing.getSeller().getId().equals(userId)) {
            throw new ForbiddenException("Não tem permissão para modificar este anúncio.");
        }
    }

    private ListingResponse buildFullResponse(Listing listing, Long currentUserId) {
        Long sellerId = listing.getSeller().getId();
        String sellerName = getDisplayName(sellerId);
        Double sellerRating = reviewRepository.findAverageRatingByTargetId(sellerId);
        int sellerListingCount = (int) listingRepository.countBySellerIdAndStatus(sellerId, ListingStatus.ACTIVE);
        List<String> photoUrls = getPhotoUrls(listing.getId());
        long favoriteCount = listingFavoriteRepository.countByListingId(listing.getId());
        boolean favorited = currentUserId != null
                && listingFavoriteRepository.existsByListingIdAndUserId(listing.getId(), currentUserId);

        return ListingMapper.toResponse(listing, sellerName, sellerRating, sellerListingCount,
                photoUrls, favoriteCount, favorited);
    }

    private String getDisplayName(Long userId) {
        return clientProfileRepository.findByUserId(userId)
                .map(ClientProfile::getName)
                .orElseGet(() -> providerProfileRepository.findByUserId(userId)
                        .map(ProviderProfile::getCompanyName)
                        .orElse("Utilizador"));
    }

    private List<String> getPhotoUrls(Long listingId) {
        return listingPhotoRepository.findByListingIdOrderBySortOrderAsc(listingId).stream()
                .map(ListingPhoto::getPhotoUrl)
                .toList();
    }

    private String getFirstPhotoUrl(Long listingId) {
        List<ListingPhoto> photos = listingPhotoRepository.findByListingIdOrderBySortOrderAsc(listingId);
        return photos.isEmpty() ? null : photos.get(0).getPhotoUrl();
    }

    private Point buildPoint(double lat, double lng) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
        point.setSRID(SRID_WGS84);
        return point;
    }
}
