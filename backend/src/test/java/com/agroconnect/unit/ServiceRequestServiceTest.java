package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.response.ServiceRequestResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.RequestPhotoRepository;
import com.agroconnect.repository.ServiceCategoryRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.ServiceRequestService;
import io.minio.MinioClient;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceRequestServiceTest {

    @Mock private ServiceRequestRepository requestRepository;
    @Mock private ServiceCategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private RequestPhotoRepository photoRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private MinioClient minioClient;

    private ServiceRequestService service;

    private User clientUser;
    private ClientProfile clientProfile;
    private ServiceCategory category;

    @BeforeEach
    void setUp() {
        service = new ServiceRequestService(
                requestRepository, categoryRepository, userRepository,
                clientProfileRepository, providerProfileRepository,
                photoRepository, proposalRepository, minioClient);

        clientUser = UserFixture.aClientUser().build();
        clientProfile = UserFixture.aClientProfile().user(clientUser).build();
        category = ServiceRequestFixture.aCategory().build();
    }

    @Test
    void create_givenValidData_shouldReturnResponse() {
        CreateServiceRequestDto dto = new CreateServiceRequestDto(
                1L, "Lavoura", "Preciso de lavoura",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                2.0, "hectares", Urgency.MEDIUM, null, null, null);

        ServiceRequest savedRequest = ServiceRequestFixture.aRequest()
                .client(clientUser).category(category).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(savedRequest);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

        ServiceRequestResponse response = service.create(dto, 1L);

        assertNotNull(response);
        assertEquals("Lavoura de 2 hectares", response.title());
        assertEquals(RequestStatus.DRAFT, response.status());
        verify(requestRepository).save(any(ServiceRequest.class));
    }

    @Test
    void create_givenInvalidCategory_shouldThrowNotFound() {
        CreateServiceRequestDto dto = new CreateServiceRequestDto(
                999L, "Test", "Test description",
                38.6667, -27.2167, null, null, null,
                null, null, null, null, null, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(dto, 1L));
    }

    @Test
    void publish_givenDraftRequest_shouldSetPublishedAndExpiry() {
        ServiceRequest draftRequest = ServiceRequestFixture.aRequest()
                .client(clientUser).category(category).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(draftRequest));
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(draftRequest);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));

        ServiceRequestResponse response = service.publish(1L, 1L);

        assertNotNull(response);
        verify(requestRepository).save(any(ServiceRequest.class));
    }

    @Test
    void publish_givenNonDraftRequest_shouldThrowInvalidState() {
        ServiceRequest publishedRequest = ServiceRequestFixture.aPublishedRequest()
                .client(clientUser).category(category).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(publishedRequest));

        assertThrows(InvalidStateException.class, () -> service.publish(1L, 1L));
    }

    @Test
    void publish_givenDifferentUser_shouldThrowForbidden() {
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .client(clientUser).category(category).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThrows(ForbiddenException.class, () -> service.publish(1L, 999L));
    }

    @Test
    void cancel_givenPublishedRequest_shouldSetCancelled() {
        ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                .client(clientUser).category(category).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(requestRepository.save(any(ServiceRequest.class))).thenReturn(request);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

        ServiceRequestResponse response = service.cancel(1L, 1L);

        assertNotNull(response);
        verify(requestRepository).save(any(ServiceRequest.class));
    }

    @Test
    void cancel_givenTerminalState_shouldThrowInvalidState() {
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .status(RequestStatus.CANCELLED)
                .client(clientUser).category(category).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThrows(InvalidStateException.class, () -> service.cancel(1L, 1L));
    }

    @Test
    void getById_givenExistingId_shouldReturnResponse() {
        ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                .client(clientUser).category(category).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(clientProfile));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());

        ServiceRequestResponse response = service.getById(1L, 1L);

        assertNotNull(response);
        assertEquals(1L, response.id());
    }

    @Test
    void getById_givenNonExistentId_shouldThrowNotFound() {
        when(requestRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(999L, 1L));
    }

    @Test
    void update_givenNonDraftRequest_shouldThrowInvalidState() {
        ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                .client(clientUser).category(category).build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThrows(InvalidStateException.class, () -> service.update(1L, null, 1L));
    }
}
