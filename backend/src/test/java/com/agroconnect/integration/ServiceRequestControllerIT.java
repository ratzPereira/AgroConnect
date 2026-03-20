package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.enums.Urgency;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ServiceRequestControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;

    @Test
    @Order(1)
    void setup_registerClientAndProvider() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "sr-client@test.pt", "password123", "password123",
                "Cliente Teste", "+351911111111", "CLIENT", null, null);

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated())
                .andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "sr-provider@test.pt", "password123", "password123",
                "Prestador Teste", "+351922222222", "PROVIDER_MANAGER", "AgroTeste Lda", "999888777");

        MvcResult providerResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated())
                .andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateServiceRequestDto dto = new CreateServiceRequestDto(
                1L, "Lavoura de teste", "Preciso de lavoura profunda para plantação",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                2.5, "hectares", Urgency.MEDIUM, null, null, null);

        MvcResult result = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.title").value("Lavoura de teste"))
                .andReturn();

        requestId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    @Order(3)
    void create_givenNoAuth_shouldReturn401() throws Exception {
        CreateServiceRequestDto dto = new CreateServiceRequestDto(
                1L, "Test", "Test",
                38.6667, -27.2167, null, null, null,
                null, null, null, null, null, null);

        mockMvc.perform(post("/v1/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(4)
    void create_givenProviderRole_shouldReturn403() throws Exception {
        CreateServiceRequestDto dto = new CreateServiceRequestDto(
                1L, "Test", "Test",
                38.6667, -27.2167, null, null, null,
                null, null, null, null, null, null);

        mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(5)
    void getById_shouldReturnRequestDetails() throws Exception {
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    @Order(6)
    void publish_shouldTransitionToPublished() throws Exception {
        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.expiresAt", notNullValue()));
    }

    @Test
    @Order(7)
    void publish_givenAlreadyPublished_shouldReturn409() throws Exception {
        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(8)
    void listMine_shouldReturnClientRequests() throws Exception {
        mockMvc.perform(get("/v1/requests/mine")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].title").value("Lavoura de teste"));
    }

    @Test
    @Order(9)
    void cancel_shouldTransitionToCancelled() throws Exception {
        // Create a new request to cancel
        CreateServiceRequestDto dto = new CreateServiceRequestDto(
                1L, "Para cancelar", "Este será cancelado",
                38.6667, -27.2167, null, null, null,
                null, null, null, null, null, null);

        MvcResult result = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long cancelId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(post("/v1/requests/" + cancelId + "/cancel")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
