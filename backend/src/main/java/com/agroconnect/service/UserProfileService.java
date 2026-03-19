package com.agroconnect.service;

import com.agroconnect.dto.request.UpdateClientProfileRequest;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.dto.response.ClientProfileResponse;
import com.agroconnect.dto.response.ProviderProfileResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.ClientProfileMapper;
import com.agroconnect.mapper.ProviderProfileMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileService {

    private static final int SRID_WGS84 = 4326;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public Object getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        return switch (user.getRole()) {
            case CLIENT -> clientProfileRepository.findByUserId(userId)
                    .map(ClientProfileMapper::toResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil de cliente não encontrado."));
            case PROVIDER_MANAGER, PROVIDER_LEAD, PROVIDER_OPERATOR ->
                    providerProfileRepository.findByUserId(userId)
                            .map(ProviderProfileMapper::toResponse)
                            .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));
            case ADMIN -> throw new ResourceNotFoundException("Perfil de administrador não disponível.");
        };
    }

    @Transactional
    public ClientProfileResponse updateClientProfile(Long userId, UpdateClientProfileRequest request) {
        ClientProfile profile = clientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de cliente não encontrado."));

        if (request.name() != null) {
            profile.setName(request.name());
        }
        if (request.phone() != null) {
            profile.setPhone(request.phone());
        }
        if (request.parish() != null) {
            profile.setParish(request.parish());
        }
        if (request.municipality() != null) {
            profile.setMunicipality(request.municipality());
        }
        if (request.island() != null) {
            profile.setIsland(request.island());
        }
        if (request.latitude() != null && request.longitude() != null) {
            profile.setLocation(createPoint(request.longitude(), request.latitude()));
        }

        profile = clientProfileRepository.save(profile);
        return ClientProfileMapper.toResponse(profile);
    }

    @Transactional
    public ProviderProfileResponse updateProviderProfile(Long userId, UpdateProviderProfileRequest request) {
        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));

        if (request.companyName() != null) {
            profile.setCompanyName(request.companyName());
        }
        if (request.nif() != null) {
            profile.setNif(request.nif());
        }
        if (request.phone() != null) {
            profile.setPhone(request.phone());
        }
        if (request.description() != null) {
            profile.setBio(request.description());
        }
        if (request.serviceRadiusKm() != null) {
            profile.setServiceRadiusKm(request.serviceRadiusKm());
        }
        if (request.latitude() != null && request.longitude() != null) {
            profile.setLocation(createPoint(request.longitude(), request.latitude()));
        }

        profile = providerProfileRepository.save(profile);
        return ProviderProfileMapper.toResponse(profile);
    }

    private Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }
}
