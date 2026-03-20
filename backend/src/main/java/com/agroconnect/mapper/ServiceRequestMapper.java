package com.agroconnect.mapper;

import com.agroconnect.dto.response.RequestPhotoResponse;
import com.agroconnect.dto.response.ServiceRequestResponse;
import com.agroconnect.dto.response.ServiceRequestSummaryResponse;
import com.agroconnect.model.RequestPhoto;
import com.agroconnect.model.ServiceRequest;

import java.util.List;

public final class ServiceRequestMapper {

    private ServiceRequestMapper() {}

    public static ServiceRequestResponse toResponse(ServiceRequest sr, String clientName, int proposalCount) {
        return new ServiceRequestResponse(
                sr.getId(),
                sr.getClient().getId(),
                clientName,
                sr.getCategory().getId(),
                sr.getCategory().getName(),
                sr.getStatus(),
                sr.getTitle(),
                sr.getDescription(),
                sr.getLocation() != null ? sr.getLocation().getY() : null,
                sr.getLocation() != null ? sr.getLocation().getX() : null,
                sr.getParish(),
                sr.getMunicipality(),
                sr.getIsland(),
                sr.getArea(),
                sr.getAreaUnit(),
                sr.getUrgency(),
                sr.getPreferredDateFrom(),
                sr.getPreferredDateTo(),
                sr.getFormData(),
                sr.getExpiresAt(),
                sr.getPhotos() != null ? sr.getPhotos().stream().map(ServiceRequestMapper::toPhotoResponse).toList() : List.of(),
                proposalCount,
                sr.getCreatedAt(),
                sr.getUpdatedAt()
        );
    }

    public static ServiceRequestSummaryResponse toSummaryResponse(ServiceRequest sr, int proposalCount) {
        return new ServiceRequestSummaryResponse(
                sr.getId(),
                sr.getCategory().getName(),
                sr.getStatus(),
                sr.getTitle(),
                sr.getParish(),
                sr.getMunicipality(),
                sr.getIsland(),
                sr.getArea(),
                sr.getAreaUnit(),
                sr.getUrgency(),
                proposalCount,
                sr.getCreatedAt()
        );
    }

    public static RequestPhotoResponse toPhotoResponse(RequestPhoto photo) {
        return new RequestPhotoResponse(
                photo.getId(),
                photo.getPhotoUrl(),
                photo.getSortOrder(),
                photo.getUploadedAt()
        );
    }
}
