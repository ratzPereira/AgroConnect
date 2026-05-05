package com.agroconnect.mapper;

import com.agroconnect.dto.response.ProviderProfileResponse;
import com.agroconnect.model.ProviderProfile;

public final class ProviderProfileMapper {

    private ProviderProfileMapper() {}

    public static ProviderProfileResponse toResponse(ProviderProfile profile) {
        Double latitude = null;
        Double longitude = null;
        if (profile.getLocation() != null) {
            latitude = profile.getLocation().getY();
            longitude = profile.getLocation().getX();
        }

        boolean profileComplete = profile.getIsland() != null && !profile.getIsland().isBlank();

        return new ProviderProfileResponse(
                profile.getId(),
                profile.getCompanyName(),
                profile.getNif(),
                profile.getPhone(),
                profile.getBio(),
                profile.getServiceRadiusKm(),
                profile.getAvgRating(),
                profile.getTotalReviews(),
                profile.isVerified(),
                latitude,
                longitude,
                profile.getIsland(),
                profile.getMunicipality(),
                profile.getParish(),
                profileComplete
        );
    }
}
