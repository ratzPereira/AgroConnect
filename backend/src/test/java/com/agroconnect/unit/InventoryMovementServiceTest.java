package com.agroconnect.unit;

import com.agroconnect.dto.request.RecordAdjustmentInDto;
import com.agroconnect.dto.request.RecordAdjustmentOutDto;
import com.agroconnect.dto.request.RecordPurchaseDto;
import com.agroconnect.dto.response.InventoryMovementResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.InventoryFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.InventoryItem;
import com.agroconnect.model.InventoryMovement;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.MovementType;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.InventoryItemRepository;
import com.agroconnect.repository.InventoryMovementRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.InventoryMovementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryMovementServiceTest {

    @Mock private InventoryItemRepository inventoryItemRepository;
    @Mock private InventoryMovementRepository inventoryMovementRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private UserRepository userRepository;

    private InventoryMovementService service;

    private User actor;
    private ProviderProfile providerProfile;
    private InventoryItem item;

    @BeforeEach
    void setUp() {
        service = new InventoryMovementService(
                inventoryItemRepository, inventoryMovementRepository,
                providerProfileRepository, clientProfileRepository, userRepository);

        actor = UserFixture.aProviderUser().id(2L).build();
        providerProfile = UserFixture.aProviderProfile().user(actor).build();
        item = InventoryFixture.anInventoryItem()
                .provider(providerProfile)
                .quantity(new BigDecimal("100.000"))
                .costPerUnit(new BigDecimal("1.0000"))
                .build();
    }

    private void stubLockedItem() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderIdForUpdate(1L, 1L)).thenReturn(Optional.of(item));
        when(userRepository.findById(2L)).thenReturn(Optional.of(actor));
        when(inventoryMovementRepository.save(any(InventoryMovement.class)))
                .thenAnswer(inv -> {
                    InventoryMovement m = inv.getArgument(0);
                    m.setId(99L);
                    m.setCreatedAt(Instant.now());
                    return m;
                });
    }

    @Test
    void recordPurchase_shouldAddStockAndRecomputeWac() {
        stubLockedItem();
        RecordPurchaseDto dto = new RecordPurchaseDto(
                new BigDecimal("100.000"), new BigDecimal("2.0000"), "Fornecedor X");

        InventoryMovementResponse response = service.recordPurchase(1L, dto, 2L);

        assertNotNull(response);
        assertEquals(MovementType.PURCHASE, response.movementType());
        assertEquals(new BigDecimal("100.000"), response.quantityDelta());
        assertEquals(new BigDecimal("2.0000"), response.unitCost());
        assertEquals(new BigDecimal("200.000"), response.quantityAfter());
        // WAC: (100*1 + 100*2) / 200 = 1.5
        assertEquals(new BigDecimal("1.5000"), response.wacAfter());
        assertEquals(new BigDecimal("200.000"), item.getQuantity());
        assertEquals(new BigDecimal("1.5000"), item.getCostPerUnit());
    }

    @Test
    void recordAdjustmentIn_withUnitCost_shouldRecomputeWac() {
        stubLockedItem();
        RecordAdjustmentInDto dto = new RecordAdjustmentInDto(
                new BigDecimal("50.000"), new BigDecimal("2.0000"), "Stock encontrado");

        InventoryMovementResponse response = service.recordAdjustmentIn(1L, dto, 2L);

        assertEquals(MovementType.ADJUSTMENT_IN, response.movementType());
        assertEquals(new BigDecimal("50.000"), response.quantityDelta());
        // WAC: (100*1 + 50*2) / 150 = 200/150 ≈ 1.3333
        assertEquals(new BigDecimal("1.3333"), response.wacAfter());
        assertEquals(new BigDecimal("150.000"), response.quantityAfter());
    }

    @Test
    void recordAdjustmentIn_withoutUnitCost_shouldPreserveWacAndStoreNullCost() {
        stubLockedItem();
        RecordAdjustmentInDto dto = new RecordAdjustmentInDto(
                new BigDecimal("25.000"), null, "Devolução interna");

        InventoryMovementResponse response = service.recordAdjustmentIn(1L, dto, 2L);

        assertEquals(MovementType.ADJUSTMENT_IN, response.movementType());
        assertNull(response.unitCost());
        assertEquals(new BigDecimal("1.0000"), response.wacAfter());
        assertEquals(new BigDecimal("125.000"), response.quantityAfter());
    }

    @Test
    void recordAdjustmentOut_shouldDecreaseStockAndPreserveWac() {
        stubLockedItem();
        RecordAdjustmentOutDto dto = new RecordAdjustmentOutDto(
                new BigDecimal("30.000"), "Estragado");

        InventoryMovementResponse response = service.recordAdjustmentOut(1L, dto, 2L);

        assertEquals(MovementType.ADJUSTMENT_OUT, response.movementType());
        assertEquals(new BigDecimal("-30.000"), response.quantityDelta());
        assertNull(response.unitCost());
        assertEquals(new BigDecimal("70.000"), response.quantityAfter());
        assertEquals(new BigDecimal("1.0000"), response.wacAfter());
    }

    @Test
    void recordAdjustmentOut_givenInsufficientStock_shouldThrowInvalidState() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderIdForUpdate(1L, 1L)).thenReturn(Optional.of(item));
        RecordAdjustmentOutDto dto = new RecordAdjustmentOutDto(
                new BigDecimal("1000.000"), "Erro");

        assertThrows(InvalidStateException.class, () -> service.recordAdjustmentOut(1L, dto, 2L));
    }

    @Test
    void recordPurchase_givenDeletedItem_shouldThrowInvalidState() {
        item.setDeletedAt(Instant.now());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderIdForUpdate(1L, 1L)).thenReturn(Optional.of(item));

        RecordPurchaseDto dto = new RecordPurchaseDto(
                new BigDecimal("10.000"), new BigDecimal("1.0000"), null);

        assertThrows(InvalidStateException.class, () -> service.recordPurchase(1L, dto, 2L));
    }

    @Test
    void recordPurchase_givenUnknownItem_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderIdForUpdate(999L, 1L)).thenReturn(Optional.empty());

        RecordPurchaseDto dto = new RecordPurchaseDto(
                new BigDecimal("10.000"), new BigDecimal("1.0000"), null);

        assertThrows(ResourceNotFoundException.class, () -> service.recordPurchase(999L, dto, 2L));
    }

    @Test
    void recordPurchase_givenUserWithoutProviderProfile_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        RecordPurchaseDto dto = new RecordPurchaseDto(
                new BigDecimal("10.000"), new BigDecimal("1.0000"), null);

        assertThrows(ForbiddenException.class, () -> service.recordPurchase(1L, dto, 99L));
    }

    @Test
    void recordConsumption_shouldDecreaseStockAndPreserveWac() {
        when(inventoryItemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(userRepository.findById(2L)).thenReturn(Optional.of(actor));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryMovement movement = service.recordConsumption(
                1L, new BigDecimal("40.000"), null, "Consumo de obra", 2L);

        assertEquals(MovementType.CONSUMPTION, movement.getMovementType());
        assertEquals(new BigDecimal("-40.000"), movement.getQuantityDelta());
        assertNull(movement.getUnitCost());
        assertEquals(new BigDecimal("60.000"), movement.getQuantityAfter());
        assertEquals(new BigDecimal("1.0000"), movement.getWacAfter());
        assertEquals(new BigDecimal("60.000"), item.getQuantity());
    }

    @Test
    void recordConsumption_givenInsufficientStock_shouldThrowInvalidState() {
        when(inventoryItemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));

        assertThrows(InvalidStateException.class, () -> service.recordConsumption(
                1L, new BigDecimal("999.000"), null, "x", 2L));
    }

    @Test
    void listForItem_shouldReturnPagedMappedMovements() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));

        InventoryMovement movement = InventoryMovement.builder()
                .id(5L)
                .item(item)
                .movementType(MovementType.PURCHASE)
                .quantityDelta(new BigDecimal("10.000"))
                .unitCost(new BigDecimal("1.0000"))
                .quantityAfter(new BigDecimal("110.000"))
                .wacAfter(new BigDecimal("1.0000"))
                .actor(actor)
                .createdAt(Instant.now())
                .build();

        Pageable pageable = PageRequest.of(0, 20);
        when(inventoryMovementRepository.findByItemIdOrderByCreatedAtDesc(1L, pageable))
                .thenReturn(new PageImpl<>(List.of(movement), pageable, 1));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        var page = service.listForItem(1L, 2L, pageable);

        assertEquals(1, page.getTotalElements());
        assertEquals(5L, page.getContent().get(0).id());
    }

    @Test
    void recordInitial_shouldSetQuantityCostAndAppendInitialMovement() {
        InventoryItem fresh = InventoryFixture.anInventoryItem()
                .quantity(BigDecimal.ZERO)
                .costPerUnit(BigDecimal.ZERO)
                .build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(actor));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<InventoryMovement> captor = ArgumentCaptor.forClass(InventoryMovement.class);
        service.recordInitial(fresh, new BigDecimal("500.000"), new BigDecimal("1.4500"), 2L);

        assertEquals(new BigDecimal("500.000"), fresh.getQuantity());
        assertEquals(new BigDecimal("1.4500"), fresh.getCostPerUnit());

        org.mockito.Mockito.verify(inventoryMovementRepository).save(captor.capture());
        InventoryMovement m = captor.getValue();
        assertEquals(MovementType.INITIAL, m.getMovementType());
        assertEquals(new BigDecimal("500.000"), m.getQuantityDelta());
        assertEquals(new BigDecimal("1.4500"), m.getUnitCost());
        assertEquals(new BigDecimal("500.000"), m.getQuantityAfter());
        assertEquals(new BigDecimal("1.4500"), m.getWacAfter());
    }
}
