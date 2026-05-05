package com.agroconnect.integration;

import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.Urgency;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ExecutionControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;
    private static Long proposalId;
    private static Long executionId;

    @Test
    @Order(1)
    void setup_fullFlowUntilAwarded() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "exec-client@test.pt", "Password1", "Password1",
                "Cliente Execução", "+351955555555", "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated());

        User clientUser = userRepository.findByEmail("exec-client@test.pt").orElseThrow();
        clientUser.setEmailVerified(true);
        userRepository.save(clientUser);

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("exec-client@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "exec-provider@test.pt", "Password1", "Password1",
                "Prestador Execução", "+351966666666", "PROVIDER_MANAGER", "ExecTest Lda", "555444333");

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated());

        User providerUser = userRepository.findByEmail("exec-provider@test.pt").orElseThrow();
        providerUser.setEmailVerified(true);
        userRepository.save(providerUser);

        MvcResult providerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("exec-provider@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Set provider location
        UpdateProviderProfileRequest profileUpdate = new UpdateProviderProfileRequest(
                null, null, null, null, null, 38.6667, -27.2167, "Terceira", "Angra do Heroísmo", null);
        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileUpdate)))
                .andExpect(status().isOk());

        // Create request
        CreateServiceRequestDto requestDto = new CreateServiceRequestDto(
                1L, "Lavoura para execução", "Teste de execução completa",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                2.5, "hectares", Urgency.MEDIUM, null, null, null);

        MvcResult reqResult = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andReturn();
        requestId = objectMapper.readTree(reqResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Publish
        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // Create proposal
        CreateProposalDto proposalDto = new CreateProposalDto(
                new BigDecimal("500.00"), PricingModel.FIXED, null, null,
                "Executo lavoura com trator moderno", "Tudo incluído", null, null, null);

        MvcResult propResult = mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(proposalDto)))
                .andExpect(status().isCreated())
                .andReturn();
        proposalId = objectMapper.readTree(propResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Accept proposal -> AWARDED + execution created
        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    @Order(2)
    void getExecutionByRequest_shouldReturnExecution() throws Exception {
        MvcResult result = mockMvc.perform(get("/v1/executions/request/" + requestId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.requestId").value(requestId))
                .andReturn();

        executionId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    @Order(3)
    void checkin_givenWithinRadius_shouldTransitionToInProgress() throws Exception {
        CheckinExecutionDto dto = new CheckinExecutionDto(38.6667, -27.2167);

        mockMvc.perform(post("/v1/executions/" + executionId + "/checkin")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkinTime", notNullValue()));

        // Verify request is now IN_PROGRESS
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @Order(4)
    void complete_shouldTransitionToAwaitingConfirmation() throws Exception {
        CompleteExecutionDto dto = new CompleteExecutionDto(
                "Lavoura concluída com sucesso", null);

        mockMvc.perform(post("/v1/executions/" + executionId + "/complete")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt", notNullValue()));

        // Verify request is now AWAITING_CONFIRMATION
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AWAITING_CONFIRMATION"));
    }

    @Test
    @Order(5)
    void confirm_shouldTransitionToCompletedAndReleasePayment() throws Exception {
        mockMvc.perform(post("/v1/requests/" + requestId + "/confirm")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}
