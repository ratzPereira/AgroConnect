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

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TransactionControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;
    private static Long proposalId;
    private static Long transactionId;

    @Test
    @Order(1)
    void setup_createRequestAndAcceptProposal() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "tx-client@test.pt", "password123", "password123",
                "Cliente Transação", "+351977777777", "CLIENT", null, null);
        MvcResult clientResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated()).andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "tx-provider@test.pt", "password123", "password123",
                "Prestador Transação", "+351988888888", "PROVIDER_MANAGER", "TxTest Lda", "222111000");
        MvcResult providerResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated()).andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Set provider location
        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateProviderProfileRequest(
                                null, null, null, null, null, 38.6667, -27.2167))))
                .andExpect(status().isOk());

        // Create + publish request
        CreateServiceRequestDto requestDto = new CreateServiceRequestDto(
                1L, "Serviço para transações", "Teste transações",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                1.0, "hectares", Urgency.LOW, null, null, null);
        MvcResult reqResult = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated()).andReturn();
        requestId = objectMapper.readTree(reqResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // Create and accept proposal → creates transaction
        CreateProposalDto proposalDto = new CreateProposalDto(
                new BigDecimal("200.00"), PricingModel.FIXED, null, null,
                "Serviço rápido", "Tudo incluído", null, null, null);
        MvcResult propResult = mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(proposalDto)))
                .andExpect(status().isCreated()).andReturn();
        proposalId = objectMapper.readTree(propResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(2)
    void listMyTransactions_asClient_shouldReturnTransactions() throws Exception {
        MvcResult result = mockMvc.perform(get("/v1/transactions/me")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("HELD"))
                .andExpect(jsonPath("$.content[0].amount").value(200.00))
                .andReturn();

        transactionId = objectMapper.readTree(result.getResponse().getContentAsString())
                .at("/content/0/id").asLong();
    }

    @Test
    @Order(3)
    void getTransaction_asProvider_shouldReturnDetail() throws Exception {
        mockMvc.perform(get("/v1/transactions/" + transactionId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(transactionId))
                .andExpect(jsonPath("$.status").value("HELD"))
                .andExpect(jsonPath("$.providerPayout", notNullValue()));
    }

    @Test
    @Order(4)
    void listMyTransactions_asProvider_shouldReturnTransactions() throws Exception {
        mockMvc.perform(get("/v1/transactions/me")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", greaterThan(0)));
    }
}
