package com.agroconnect.unit;

import com.agroconnect.dto.request.UpdateClientProfileRequest;
import com.agroconnect.dto.response.ClientProfileResponse;
import com.agroconnect.dto.response.ProviderProfileResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClientProfileRepository clientProfileRepository;
    @Mock
    private ProviderProfileRepository providerProfileRepository;

    private UserProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService = new UserProfileService(userRepository, clientProfileRepository, providerProfileRepository);
    }

    @Test
    void getMyProfile_givenClientUser_shouldReturnClientProfile() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        Object result = profileService.getMyProfile(1L);

        assertNotNull(result);
        assertTrue(result instanceof ClientProfileResponse);
        assertEquals("João Silva", ((ClientProfileResponse) result).name());
    }

    @Test
    void getMyProfile_givenProviderUser_shouldReturnProviderProfile() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));

        Object result = profileService.getMyProfile(2L);

        assertNotNull(result);
        assertTrue(result instanceof ProviderProfileResponse);
        assertEquals("AgroServiços Terceira", ((ProviderProfileResponse) result).companyName());
    }

    @Test
    void getMyProfile_givenNonExistentUser_shouldThrowResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> profileService.getMyProfile(99L));
    }

    @Test
    void updateClientProfile_givenValidData_shouldReturnUpdatedProfile() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        UpdateClientProfileRequest request = new UpdateClientProfileRequest(
                "João Updated", "+351999999999", "Praia da Vitória",
                "Praia da Vitória", "Terceira", null, null);

        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(clientProfileRepository.save(any(ClientProfile.class))).thenReturn(profile);

        ClientProfileResponse result = profileService.updateClientProfile(1L, request);

        assertNotNull(result);
    }

    @Test
    void updateClientProfile_givenNonExistentProfile_shouldThrowResourceNotFound() {
        when(clientProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        UpdateClientProfileRequest request = new UpdateClientProfileRequest(
                "Test", null, null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class,
                () -> profileService.updateClientProfile(99L, request));
    }
}
