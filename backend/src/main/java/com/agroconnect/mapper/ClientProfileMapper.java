package com.agroconnect.mapper;

import com.agroconnect.dto.response.ClientProfileResponse;
import com.agroconnect.model.ClientProfile;

public final class ClientProfileMapper {

    private ClientProfileMapper() {}

    public static ClientProfileResponse toResponse(ClientProfile profile) {
        Double latitude = null;
        Double longitude = null;
        if (profile.getLocation() != null) {
            latitude = profile.getLocation().getY();
            longitude = profile.getLocation().getX();
        }

        return new ClientProfileResponse(
                profile.getId(),
                profile.getName(),
                profile.getPhone(),
                profile.getParish(),
                profile.getMunicipality(),
                profile.getIsland(),
                latitude,
                longitude
        );
    }
}
