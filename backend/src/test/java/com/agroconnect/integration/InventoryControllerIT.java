package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateInventoryItemDto;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateInventoryItemDto;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.enums.InventoryUnit;
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

    private static String providerToken;
    private static Long itemId;

    @Test
    @Order(1)
    void setup_registerProvider() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "inv-provider@test.pt", "password123", "password123",
                "Inv Provider", "+351922000003", "PROVIDER_MANAGER", "AgroStock Lda", "333444555");
        MvcResult result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated()).andReturn();
        providerToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    @Order(2)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateInventoryItemDto dto = new CreateInventoryItemDto("Gasóleo agrícola", InventoryUnit.L, 500.0, 50.0, new BigDecimal("1.45"));

        MvcResult result = mockMvc.perform(post("/v1/providers/me/inventory")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.productName").value("Gasóleo agrícola"))
                .andExpect(jsonPath("$.lowStock").value(false))
                .andReturn();
        itemId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(3)
    void update_givenLowQuantity_shouldShowLowStock() throws Exception {
        UpdateInventoryItemDto dto = new UpdateInventoryItemDto(10.0, 50.0, new BigDecimal("1.50"));

        mockMvc.perform(put("/v1/providers/me/inventory/" + itemId)
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(10.0))
                .andExpect(jsonPath("$.lowStock").value(true));
    }

    @Test
    @Order(4)
    void lowStock_shouldReturnLowStockItems() throws Exception {
        mockMvc.perform(get("/v1/providers/me/inventory/low-stock")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productName").value("Gasóleo agrícola"));
    }
}
