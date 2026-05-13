package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateInventoryItemDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RecordAdjustmentInDto;
import com.agroconnect.dto.request.RecordAdjustmentOutDto;
import com.agroconnect.dto.request.RecordPurchaseDto;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateInventoryItemDto;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.InventoryUnit;
import com.agroconnect.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class InventoryControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static String providerToken;
    private static Long itemId;

    @Test
    @Order(1)
    void setup_registerProvider() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "inv-provider@test.pt", "Password1", "Password1",
                "Inv Provider", "+351922000003", "PROVIDER_MANAGER", "AgroStock Lda", "333444555");
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("inv-provider@test.pt").orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);

        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("inv-provider@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        providerToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateInventoryItemDto dto = new CreateInventoryItemDto(
                "Gasoleo agricola", InventoryUnit.L,
                new BigDecimal("500.000"), new BigDecimal("50.000"), new BigDecimal("1.4500"));

        MvcResult result = mockMvc.perform(post("/v1/providers/me/inventory")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.productName").value("Gasoleo agricola"))
                .andExpect(jsonPath("$.lowStock").value(false))
                .andReturn();
        itemId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(3)
    void update_givenAlertAboveQuantity_shouldShowLowStock() throws Exception {
        UpdateInventoryItemDto dto = new UpdateInventoryItemDto(null, new BigDecimal("600.000"));

        mockMvc.perform(put("/v1/providers/me/inventory/" + itemId)
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(500.000))
                .andExpect(jsonPath("$.lowStock").value(true));
    }

    @Test
    @Order(4)
    void lowStock_shouldReturnLowStockItems() throws Exception {
        mockMvc.perform(get("/v1/providers/me/inventory/low-stock")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productName").value("Gasoleo agricola"));
    }

    @Test
    @Order(5)
    void recordPurchase_shouldIncreaseStockAndRecomputeWac() throws Exception {
        RecordPurchaseDto dto = new RecordPurchaseDto(
                new BigDecimal("100.000"), new BigDecimal("2.0000"), "Fornecedor Repsol");

        mockMvc.perform(post("/v1/providers/me/inventory/" + itemId + "/movements/purchase")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.movementType").value("PURCHASE"))
                .andExpect(jsonPath("$.quantityAfter").value(600.000))
                // WAC: (500*1.45 + 100*2) / 600 = 925 / 600 ≈ 1.5417
                .andExpect(jsonPath("$.wacAfter").value(1.5417));

        mockMvc.perform(get("/v1/providers/me/inventory/" + itemId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(600.000))
                .andExpect(jsonPath("$.costPerUnit").value(1.5417));
    }

    @Test
    @Order(6)
    void recordAdjustmentIn_withoutCost_shouldPreserveWac() throws Exception {
        RecordAdjustmentInDto dto = new RecordAdjustmentInDto(
                new BigDecimal("50.000"), null, "Stock encontrado");

        mockMvc.perform(post("/v1/providers/me/inventory/" + itemId + "/movements/adjustment-in")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantityAfter").value(650.000))
                .andExpect(jsonPath("$.wacAfter").value(1.5417));
    }

    @Test
    @Order(7)
    void recordAdjustmentOut_shouldDecreaseStock() throws Exception {
        RecordAdjustmentOutDto dto = new RecordAdjustmentOutDto(
                new BigDecimal("100.000"), "Estragado");

        mockMvc.perform(post("/v1/providers/me/inventory/" + itemId + "/movements/adjustment-out")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantityAfter").value(550.000))
                .andExpect(jsonPath("$.wacAfter").value(1.5417));
    }

    @Test
    @Order(8)
    void recordAdjustmentOut_givenInsufficientStock_shouldReturn409() throws Exception {
        RecordAdjustmentOutDto dto = new RecordAdjustmentOutDto(
                new BigDecimal("99999.000"), "Erro");

        mockMvc.perform(post("/v1/providers/me/inventory/" + itemId + "/movements/adjustment-out")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(9)
    void listMovements_shouldReturnLedgerNewestFirst() throws Exception {
        mockMvc.perform(get("/v1/providers/me/inventory/" + itemId + "/movements?page=0&size=10")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                // INITIAL + PURCHASE + ADJUSTMENT_IN + ADJUSTMENT_OUT = 4 movements
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.content[0].movementType").value("ADJUSTMENT_OUT"))
                .andExpect(jsonPath("$.content[3].movementType").value("INITIAL"));
    }

    @Test
    @Order(10)
    void delete_givenPositiveStock_shouldReturn409() throws Exception {
        // Item still has 550 units from prior movements — soft-delete must refuse.
        mockMvc.perform(delete("/v1/providers/me/inventory/" + itemId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/v1/providers/me/inventory")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @Order(11)
    void delete_afterZeroingStock_shouldSoftDeleteAndHideFromList() throws Exception {
        // Drain remaining 550 units, then soft-delete is allowed.
        RecordAdjustmentOutDto drain = new RecordAdjustmentOutDto(
                new BigDecimal("550.000"), "Encerramento");
        mockMvc.perform(post("/v1/providers/me/inventory/" + itemId + "/movements/adjustment-out")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(drain)))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/v1/providers/me/inventory/" + itemId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/v1/providers/me/inventory")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @Order(12)
    void recordPurchase_afterDelete_shouldReturn404() throws Exception {
        // Soft-deleted items are hidden by @SQLRestriction, so any operation
        // on the resource ID returns 404 (resource no longer exists from
        // the API's perspective). The 409 (InvalidStateException) branch in
        // the service is defensive coverage if the restriction is bypassed.
        RecordPurchaseDto dto = new RecordPurchaseDto(
                new BigDecimal("10.000"), new BigDecimal("1.0000"), null);

        mockMvc.perform(post("/v1/providers/me/inventory/" + itemId + "/movements/purchase")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }
}
