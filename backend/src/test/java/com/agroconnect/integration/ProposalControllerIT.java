package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.Urgency;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProposalControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;
    private static Long proposalId;

    @Test
    @Order(1)
    void setup_registerUsersAndCreateRequest() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "prop-client@test.pt", "password123", "password123",
                "Cliente Propostas", "+351933333333", "CLIENT", null, null);

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated())
                .andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "prop-provider@test.pt", "password123", "password123",
                "Prestador Propostas", "+351944444444", "PROVIDER_MANAGER", "PropostasTeste Lda", "888777666");

        MvcResult providerResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated())
                .andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Set provider location (needed for radius checks)
        UpdateProviderProfileRequest profileUpdate = new UpdateProviderProfileRequest(
                null, null, null, null, null, 38.6667, -27.2167);
        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileUpdate)))
                .andExpect(status().isOk());

        // Create and publish a service request
        CreateServiceRequestDto requestDto = new CreateServiceRequestDto(
                1L, "Serviço para propostas", "Teste de propostas completas",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                3.0, "hectares", Urgency.HIGH, null, null, null);

        MvcResult requestResult = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andReturn();
        requestId = objectMapper.readTree(requestResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Publish the request
        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    @Order(2)
    void createProposal_givenValidData_shouldReturn201() throws Exception {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("350.00"), PricingModel.FIXED, null, null,
                "Executo com trator de 150cv", "Combustível e operador incluídos",
                "Remoção de pedras", null, null);

        MvcResult result = mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.price").value(350.00))
                .andReturn();

        proposalId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    @Order(3)
    void createProposal_givenDuplicate_shouldReturn409() throws Exception {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("400.00"), PricingModel.FIXED, null, null,
                "Segunda tentativa", null, null, null, null);

        mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(4)
    void createProposal_givenClientRole_shouldReturn403() throws Exception {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Test", null, null, null, null);

        mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(5)
    void listByRequest_shouldReturnProposals() throws Exception {
        mockMvc.perform(get("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(proposalId));
    }

    @Test
    @Order(6)
    void verifyRequestStatusAfterProposal_shouldBeWithProposals() throws Exception {
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITH_PROPOSALS"));
    }

    @Test
    @Order(7)
    void acceptProposal_shouldAwardRequestAndCreateTransaction() throws Exception {
        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // Verify request is now AWARDED
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AWARDED"));
    }

    @Test
    @Order(8)
    void acceptProposal_givenAlreadyAccepted_shouldReturn409() throws Exception {
        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(9)
    void listMyProposals_shouldReturnProviderProposals() throws Exception {
        mockMvc.perform(get("/v1/proposals/mine")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(proposalId));
    }
}
