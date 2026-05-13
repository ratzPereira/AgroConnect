package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateInventoryItemDto;
import com.agroconnect.dto.request.UpdateInventoryItemDto;
import com.agroconnect.dto.response.InventoryItemResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.InventoryFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.InventoryItem;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.InventoryUnit;
import com.agroconnect.repository.InventoryItemRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.service.InventoryMovementService;
import com.agroconnect.service.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock private InventoryItemRepository inventoryItemRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private InventoryMovementService inventoryMovementService;

    private InventoryService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private InventoryItem item;

    @BeforeEach
    void setUp() {
        service = new InventoryService(inventoryItemRepository, providerProfileRepository, inventoryMovementService);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        item = InventoryFixture.anInventoryItem().provider(providerProfile).build();
    }

    @Test
    void create_givenValidData_shouldCreateItem() {
        CreateInventoryItemDto dto = new CreateInventoryItemDto(
                "Gasóleo", InventoryUnit.L,
                new BigDecimal("500.000"), new BigDecimal("50.000"), new BigDecimal("1.4500"));

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.existsByProviderIdAndProductName(1L, "Gasóleo")).thenReturn(false);
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(item);

        InventoryItemResponse response = service.create(dto, 2L);

        assertNotNull(response);
        verify(inventoryItemRepository).save(any(InventoryItem.class));
    }

    @Test
    void create_givenNullCost_shouldDefaultToZero() {
        CreateInventoryItemDto dto = new CreateInventoryItemDto(
                "Adubo", InventoryUnit.KG,
                new BigDecimal("100.000"), null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.existsByProviderIdAndProductName(1L, "Adubo")).thenReturn(false);
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(item);

        ArgumentCaptor<InventoryItem> captor = ArgumentCaptor.forClass(InventoryItem.class);
        service.create(dto, 2L);

        verify(inventoryItemRepository).save(captor.capture());
        assertEquals(0, captor.getValue().getCostPerUnit().compareTo(BigDecimal.ZERO));
    }

    @Test
    void create_givenDuplicateName_shouldThrowInvalidState() {
        CreateInventoryItemDto dto = new CreateInventoryItemDto(
                "Gasóleo", InventoryUnit.L,
                new BigDecimal("500.000"), null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.existsByProviderIdAndProductName(1L, "Gasóleo")).thenReturn(true);

        assertThrows(InvalidStateException.class, () -> service.create(dto, 2L));
    }

    @Test
    void update_givenNewAlertThreshold_shouldUpdate() {
        UpdateInventoryItemDto dto = new UpdateInventoryItemDto(null, new BigDecimal("75.000"));

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(item);

        InventoryItemResponse response = service.update(1L, dto, 2L);

        assertNotNull(response);
        assertEquals(new BigDecimal("75.000"), item.getMinStockAlert());
    }

    @Test
    void update_givenNullAlert_shouldClearThreshold() {
        UpdateInventoryItemDto dto = new UpdateInventoryItemDto(null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(item);

        service.update(1L, dto, 2L);

        assertNull(item.getMinStockAlert());
    }

    @Test
    void update_givenRenameToFreeName_shouldRename() {
        UpdateInventoryItemDto dto = new UpdateInventoryItemDto("Gasóleo verde", new BigDecimal("50.000"));

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));
        when(inventoryItemRepository.existsByProviderIdAndProductName(1L, "Gasóleo verde")).thenReturn(false);
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(item);

        service.update(1L, dto, 2L);

        assertEquals("Gasóleo verde", item.getProductName());
    }

    @Test
    void update_givenRenameToTakenName_shouldThrowInvalidState() {
        UpdateInventoryItemDto dto = new UpdateInventoryItemDto("Outro produto", new BigDecimal("50.000"));

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));
        when(inventoryItemRepository.existsByProviderIdAndProductName(1L, "Outro produto")).thenReturn(true);

        assertThrows(InvalidStateException.class, () -> service.update(1L, dto, 2L));
    }

    @Test
    void getLowStockItems_shouldReturnOnlyLowStockItems() {
        InventoryItem lowItem = InventoryFixture.aLowStockItem().provider(providerProfile).build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findLowStockByProviderId(1L)).thenReturn(List.of(lowItem));

        List<InventoryItemResponse> result = service.getLowStockItems(2L);

        assertEquals(1, result.size());
        assertTrue(result.get(0).lowStock());
    }

    @Test
    void delete_givenZeroStockItem_shouldSoftDelete() {
        item.setQuantity(BigDecimal.ZERO);
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(item);

        service.delete(1L, 2L);

        verify(inventoryItemRepository).save(item);
        assertNotNull(item.getDeletedAt());
    }

    @Test
    void delete_givenItemWithStock_shouldThrowInvalidState() {
        // item fixture has quantity=500 by default — must refuse soft-delete
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));

        assertThrows(InvalidStateException.class, () -> service.delete(1L, 2L));
        assertNull(item.getDeletedAt());
    }

    @Test
    void listByProvider_shouldReturnAllItems() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByProviderId(1L)).thenReturn(List.of(item));

        List<InventoryItemResponse> result = service.listByProvider(2L);

        assertEquals(1, result.size());
    }

    @Test
    void getById_givenValidItem_shouldReturnResponse() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));

        InventoryItemResponse response = service.getById(1L, 2L);

        assertNotNull(response);
    }

    @Test
    void getById_givenNonExistentItem_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(999L, 2L));
    }

    @Test
    void delete_givenNonExistentItem_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(999L, 2L));
    }

    @Test
    void listByProvider_givenWrongProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.listByProvider(99L));
    }

    @Test
    void update_givenNonExistentItem_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        UpdateInventoryItemDto dto = new UpdateInventoryItemDto(null, new BigDecimal("10.000"));
        assertThrows(ResourceNotFoundException.class, () -> service.update(999L, dto, 2L));
    }
}
