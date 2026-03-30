package com.agroconnect.unit;

import com.agroconnect.dto.request.UpdateClientProfileRequest;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.dto.response.ClientProfileResponse;
import com.agroconnect.dto.response.ProviderProfileResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;
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
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;

    private UserProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService = new UserProfileService(userRepository, clientProfileRepository, providerProfileRepository);
    }

    // --- getMyProfile ---

    @Test
    void getMyProfile_givenExistingClientUser_shouldReturnClientProfile() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        Object result = profileService.getMyProfile(1L);

        assertNotNull(result);
        assertInstanceOf(ClientProfileResponse.class, result);
        assertEquals("João Silva", ((ClientProfileResponse) result).name());
    }

    @Test
    void getMyProfile_givenExistingProviderUser_shouldReturnProviderProfile() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));

        Object result = profileService.getMyProfile(2L);

        assertNotNull(result);
        assertInstanceOf(ProviderProfileResponse.class, result);
        assertEquals("AgroServiços Terceira", ((ProviderProfileResponse) result).companyName());
    }

    @Test
    void getMyProfile_givenNonExistingUser_shouldThrowNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> profileService.getMyProfile(99L));
    }

    @Test
    void getMyProfile_givenAdminUser_shouldThrowNotFound() {
        User admin = User.builder()
                .id(10L).email("admin@agroconnect.pt")
                .passwordHash("$2a$12$hash").role(Role.ADMIN)
                .emailVerified(true).active(true).build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(admin));

        assertThrows(ResourceNotFoundException.class, () -> profileService.getMyProfile(10L));
    }

    @Test
    void getMyProfile_givenClientUserWithNoProfile_shouldThrowNotFound() {
        User user = UserFixture.aClientUser().build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> profileService.getMyProfile(1L));
    }

    @Test
    void getMyProfile_givenProviderUserWithNoProfile_shouldThrowNotFound() {
        User user = UserFixture.aProviderUser().build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> profileService.getMyProfile(2L));
    }

    @Test
    void getMyProfile_givenProviderLeadRole_shouldReturnProviderProfile() {
        User user = User.builder()
                .id(3L).email("lead@email.pt")
                .passwordHash("$2a$12$hash").role(Role.PROVIDER_LEAD)
                .emailVerified(true).active(true).build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(3L)).thenReturn(Optional.of(profile));

        Object result = profileService.getMyProfile(3L);

        assertNotNull(result);
        assertInstanceOf(ProviderProfileResponse.class, result);
    }

    @Test
    void getMyProfile_givenProviderOperatorRole_shouldReturnProviderProfile() {
        User user = User.builder()
                .id(4L).email("operator@email.pt")
                .passwordHash("$2a$12$hash").role(Role.PROVIDER_OPERATOR)
                .emailVerified(true).active(true).build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(4L)).thenReturn(Optional.of(profile));

        Object result = profileService.getMyProfile(4L);

        assertNotNull(result);
        assertInstanceOf(ProviderProfileResponse.class, result);
    }

    // --- updateClientProfile ---

    @Test
    void updateClientProfile_shouldUpdateNameAndPhone() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        UpdateClientProfileRequest request = new UpdateClientProfileRequest(
                "João Updated", "+351999999999", null, null, null, null, null);

        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(clientProfileRepository.save(any(ClientProfile.class))).thenReturn(profile);

        ClientProfileResponse result = profileService.updateClientProfile(1L, request);

        assertNotNull(result);
        assertEquals("João Updated", profile.getName());
        assertEquals("+351999999999", profile.getPhone());
        verify(clientProfileRepository).save(profile);
    }

    @Test
    void updateClientProfile_shouldUpdateLocationFields() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        UpdateClientProfileRequest request = new UpdateClientProfileRequest(
                null, null, "Praia da Vitória", "Praia da Vitória", "Terceira", 38.73, -27.06);

        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(clientProfileRepository.save(any(ClientProfile.class))).thenReturn(profile);

        ClientProfileResponse result = profileService.updateClientProfile(1L, request);

        assertNotNull(result);
        assertEquals("Praia da Vitória", profile.getParish());
        assertEquals("Praia da Vitória", profile.getMunicipality());
        assertEquals("Terceira", profile.getIsland());
        assertNotNull(profile.getLocation());
    }

    @Test
    void updateClientProfile_givenNullFields_shouldNotOverwrite() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();
        String originalName = profile.getName();
        String originalPhone = profile.getPhone();

        UpdateClientProfileRequest request = new UpdateClientProfileRequest(
                null, null, null, null, null, null, null);

        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(clientProfileRepository.save(any(ClientProfile.class))).thenReturn(profile);

        profileService.updateClientProfile(1L, request);

        assertEquals(originalName, profile.getName());
        assertEquals(originalPhone, profile.getPhone());
    }

    @Test
    void updateClientProfile_givenNonExistingProfile_shouldThrowNotFound() {
        when(clientProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        UpdateClientProfileRequest request = new UpdateClientProfileRequest(
                "Test", null, null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class,
                () -> profileService.updateClientProfile(99L, request));
    }

    // --- updateProviderProfile ---

    @Test
    void updateProviderProfile_shouldUpdateFields() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        UpdateProviderProfileRequest request = new UpdateProviderProfileRequest(
                "New Company Name", "987654321", "+351911111111",
                "Serviços agrícolas premium", 50.0,
                38.73, -27.06, "Terceira", "Angra do Heroísmo", "São Pedro");

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));
        when(providerProfileRepository.save(any(ProviderProfile.class))).thenReturn(profile);

        ProviderProfileResponse result = profileService.updateProviderProfile(2L, request);

        assertNotNull(result);
        assertEquals("New Company Name", profile.getCompanyName());
        assertEquals("987654321", profile.getNif());
        assertEquals("+351911111111", profile.getPhone());
        assertEquals("Serviços agrícolas premium", profile.getBio());
        assertEquals(50.0, profile.getServiceRadiusKm());
        assertNotNull(profile.getLocation());
        assertEquals("Terceira", profile.getIsland());
        assertEquals("Angra do Heroísmo", profile.getMunicipality());
        assertEquals("São Pedro", profile.getParish());
    }

    @Test
    void updateProviderProfile_givenPartialUpdate_shouldOnlyUpdateProvided() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();
        String originalNif = profile.getNif();

        UpdateProviderProfileRequest request = new UpdateProviderProfileRequest(
                "Updated Name", null, null, null, null,
                null, null, null, null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));
        when(providerProfileRepository.save(any(ProviderProfile.class))).thenReturn(profile);

        profileService.updateProviderProfile(2L, request);

        assertEquals("Updated Name", profile.getCompanyName());
        assertEquals(originalNif, profile.getNif());
    }

    @Test
    void updateProviderProfile_givenNonExistingProfile_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        UpdateProviderProfileRequest request = new UpdateProviderProfileRequest(
                "Test", null, null, null, null,
                null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class,
                () -> profileService.updateProviderProfile(99L, request));
    }
}
