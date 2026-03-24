package com.agroconnect.integration;

import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.request.CreateReviewDto;
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
class ReviewControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;
    private static Long proposalId;
    private static Long executionId;
    private static Long providerProfileId;

    @Test
    @Order(1)
    void setup_fullFlowToCompleted() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "rev-client@test.pt", "password123", "password123",
                "Cliente Reviews", "+351911111111", "CLIENT", null, null);
        MvcResult clientResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated()).andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "rev-provider@test.pt", "password123", "password123",
                "Prestador Reviews", "+351922222222", "PROVIDER_MANAGER", "ReviewTest Lda", "111222333");
        MvcResult providerResult = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated()).andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Set provider location
        MvcResult profileResult = mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateProviderProfileRequest(
                                null, null, null, null, null, 38.6667, -27.2167, "Terceira", "Angra do Heroísmo", null))))
                .andExpect(status().isOk()).andReturn();
        providerProfileId = objectMapper.readTree(profileResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Create + publish request
        CreateServiceRequestDto requestDto = new CreateServiceRequestDto(
                1L, "Serviço para reviews", "Teste avaliações completas",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                1.5, "hectares", Urgency.MEDIUM, null, null, null);
        MvcResult reqResult = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated()).andReturn();
        requestId = objectMapper.readTree(reqResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // Create and accept proposal
        CreateProposalDto proposalDto = new CreateProposalDto(
                new BigDecimal("300.00"), PricingModel.FIXED, null, null,
                "Serviço de qualidade", "Tudo incluído", null, null, null);
        MvcResult propResult = mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(proposalDto)))
                .andExpect(status().isCreated()).andReturn();
        proposalId = objectMapper.readTree(propResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // Get execution ID
        MvcResult execResult = mockMvc.perform(get("/v1/executions/request/" + requestId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk()).andReturn();
        executionId = objectMapper.readTree(execResult.getResponse().getContentAsString()).get("id").asLong();

        // Check-in
        mockMvc.perform(post("/v1/executions/" + executionId + "/checkin")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CheckinExecutionDto(38.6667, -27.2167))))
                .andExpect(status().isOk());

        // Complete
        mockMvc.perform(post("/v1/executions/" + executionId + "/complete")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CompleteExecutionDto("Tudo concluído", null))))
                .andExpect(status().isOk());

        // Confirm
        mockMvc.perform(post("/v1/requests/" + requestId + "/confirm")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @Order(2)
    void createReview_asClient_shouldReturn201() throws Exception {
        CreateReviewDto dto = new CreateReviewDto(5, "Excelente trabalho, muito profissional e pontual!");

        mockMvc.perform(post("/v1/requests/" + requestId + "/reviews")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Excelente trabalho, muito profissional e pontual!"));
    }

    @Test
    @Order(3)
    void createReview_givenDuplicate_shouldReturn409() throws Exception {
        CreateReviewDto dto = new CreateReviewDto(4, "Segunda tentativa de avaliação não deveria funcionar");

        mockMvc.perform(post("/v1/requests/" + requestId + "/reviews")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(4)
    void createReview_asProvider_shouldTransitionToRated() throws Exception {
        CreateReviewDto dto = new CreateReviewDto(4, "Cliente muito prestável e cooperativo durante todo o processo.");

        mockMvc.perform(post("/v1/requests/" + requestId + "/reviews")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(4));

        // Verify request transitioned to RATED
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RATED"));
    }

    @Test
    @Order(5)
    void getProviderReviews_shouldReturnReviews() throws Exception {
        mockMvc.perform(get("/v1/providers/" + providerProfileId + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].rating").value(5));
    }

    @Test
    @Order(6)
    void getMyReviews_asProvider_shouldReturnReceivedReviews() throws Exception {
        mockMvc.perform(get("/v1/users/me/reviews")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].rating", notNullValue()));
    }
}
