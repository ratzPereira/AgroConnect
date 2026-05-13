package com.agroconnect.integration;

import com.agroconnect.dto.request.AssignExecutionDto;
import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.request.CreateInventoryItemDto;
import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.CreateTeamMemberDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RecordResourceUsageDto;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateAssignmentHoursDto;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.fixture.StripeTestHelper;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.InventoryUnit;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.TeamMemberRole;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.ProposalService;
import com.agroconnect.service.StripeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProposalService proposalService;

    @MockBean
    private StripeService stripeService;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;
    private static Long proposalId;
    private static Long executionId;
    private static Long teamMemberId;
    private static Long assignmentId;
    private static Long inventoryItemId;
    private static Long usageId;

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

        StripeTestHelper.markProviderStripeReady(providerProfileRepository, providerUser.getId());

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

        // Accept proposal -> creates Transaction + PaymentIntent. Cascade (proposal ACCEPTED,
        // request AWARDED, execution created) is replayed below since Stripe is mocked.
        StripeTestHelper.stubCreatePaymentIntent(stripeService, "pi_test_exec", "pi_test_exec_secret");
        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        StripeTestHelper.simulateWebhookCascade(transactionRepository, proposalService, requestId);
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
    void getCosts_givenEmptyExecution_shouldReturnZeros() throws Exception {
        mockMvc.perform(get("/v1/executions/" + executionId + "/costs")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.executionId").value(executionId))
                .andExpect(jsonPath("$.revenue").value(500.00))
                .andExpect(jsonPath("$.materialsCost").value(0.00))
                .andExpect(jsonPath("$.laborCost").value(0.00))
                // 500 * 0.12 = 60.00
                .andExpect(jsonPath("$.commission").value(60.00))
                // 500 - 60 = 440
                .andExpect(jsonPath("$.netProfit").value(440.00))
                .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    @Order(5)
    void getCosts_givenNonProviderUser_shouldReturn403() throws Exception {
        mockMvc.perform(get("/v1/executions/" + executionId + "/costs")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(6)
    void setupTeamMemberAssignmentAndInventory_shouldSucceed() throws Exception {
        // Create team member with hourly rate
        CreateTeamMemberDto memberDto = new CreateTeamMemberDto(
                "Manuel Operário", "manuel@test.pt", "+351913000099",
                TeamMemberRole.OPERATOR, new BigDecimal("10.00"));
        MvcResult mResult = mockMvc.perform(post("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(memberDto)))
                .andExpect(status().isCreated())
                .andReturn();
        teamMemberId = objectMapper.readTree(mResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Assign team member to execution
        AssignExecutionDto assignDto = new AssignExecutionDto(teamMemberId, null);
        MvcResult aResult = mockMvc.perform(post("/v1/executions/" + executionId + "/assign")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignDto)))
                .andExpect(status().isOk())
                .andReturn();
        assignmentId = objectMapper.readTree(aResult.getResponse().getContentAsString())
                .get("assignments").get(0).get("id").asLong();

        // Create inventory item with initial stock
        CreateInventoryItemDto inventoryDto = new CreateInventoryItemDto(
                "Adubo NPK", InventoryUnit.KG, new BigDecimal("100.000"),
                new BigDecimal("10.000"), new BigDecimal("2.0000"));
        MvcResult iResult = mockMvc.perform(post("/v1/providers/me/inventory")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inventoryDto)))
                .andExpect(status().isCreated())
                .andReturn();
        inventoryItemId = objectMapper.readTree(iResult.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    @Order(7)
    void updateAssignmentHours_shouldPersistAndPreviewLabor() throws Exception {
        UpdateAssignmentHoursDto dto = new UpdateAssignmentHoursDto(
                new BigDecimal("8.00"), new BigDecimal("6.50"));

        mockMvc.perform(patch("/v1/executions/" + executionId
                                + "/assignments/" + assignmentId + "/hours")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hoursWorked").value(8.00))
                .andExpect(jsonPath("$.machineHours").value(6.50))
                .andExpect(jsonPath("$.effectiveHourlyRate").value(10.00))
                // 8 * 10 = 80.00
                .andExpect(jsonPath("$.laborCost").value(80.00));
    }

    @Test
    @Order(8)
    void recordResourceUsage_shouldDecreaseStockAndReturnConsumption() throws Exception {
        RecordResourceUsageDto dto = new RecordResourceUsageDto(
                inventoryItemId, new BigDecimal("12.500"), "Adubo aplicado no talhão A");

        MvcResult result = mockMvc.perform(post("/v1/executions/" + executionId + "/resource-usage")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.inventoryItemId").value(inventoryItemId))
                .andExpect(jsonPath("$.quantity").value(12.500))
                .andExpect(jsonPath("$.unitCostSnapshot").value(2.0000))
                // 12.5 * 2 = 25.0000
                .andExpect(jsonPath("$.totalCost").value(25.0000))
                .andReturn();
        usageId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();

        // Verify stock decreased: 100 - 12.5 = 87.5
        mockMvc.perform(get("/v1/providers/me/inventory/" + inventoryItemId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(87.500));
    }

    @Test
    @Order(9)
    void getCosts_afterUsageAndHours_shouldShowMaterialsAndLabor() throws Exception {
        mockMvc.perform(get("/v1/executions/" + executionId + "/costs")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revenue").value(500.00))
                .andExpect(jsonPath("$.materialsCost").value(25.00))
                .andExpect(jsonPath("$.laborCost").value(80.00))
                .andExpect(jsonPath("$.commission").value(60.00))
                // 500 - 25 - 80 - 60 = 335.00
                .andExpect(jsonPath("$.netProfit").value(335.00))
                .andExpect(jsonPath("$.assignments[0].laborCost").value(80.00))
                .andExpect(jsonPath("$.resourceUsages[0].totalCost").value(25.0000))
                .andExpect(jsonPath("$.assignmentsMissingRate").value(0));
    }

    @Test
    @Order(10)
    void recordResourceUsage_givenInsufficientStock_shouldReturn409() throws Exception {
        RecordResourceUsageDto dto = new RecordResourceUsageDto(
                inventoryItemId, new BigDecimal("9999.000"), null);

        mockMvc.perform(post("/v1/executions/" + executionId + "/resource-usage")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(11)
    void deleteResourceUsage_shouldReverseConsumption() throws Exception {
        mockMvc.perform(delete("/v1/executions/" + executionId
                                + "/resource-usage/" + usageId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNoContent());

        // Stock restored: 87.5 + 12.5 = 100
        mockMvc.perform(get("/v1/providers/me/inventory/" + inventoryItemId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(100.000));

        // Costs no longer include the reversed material
        mockMvc.perform(get("/v1/executions/" + executionId + "/costs")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.materialsCost").value(0.00))
                .andExpect(jsonPath("$.resourceUsages.length()").value(0));
    }

    @Test
    @Order(12)
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
    @Order(13)
    void recordResourceUsage_afterComplete_shouldReturn409() throws Exception {
        RecordResourceUsageDto dto = new RecordResourceUsageDto(
                inventoryItemId, new BigDecimal("1.000"), null);

        mockMvc.perform(post("/v1/executions/" + executionId + "/resource-usage")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(14)
    void getCosts_afterComplete_shouldShowCompletedTrueAndSnapshotRate() throws Exception {
        mockMvc.perform(get("/v1/executions/" + executionId + "/costs")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.assignments[0].effectiveHourlyRate").value(10.00))
                .andExpect(jsonPath("$.laborCost").value(80.00));
    }

    @Test
    @Order(15)
    void confirm_shouldTransitionToCompletedAndReleasePayment() throws Exception {
        StripeTestHelper.stubCreateTransfer(stripeService, "tr_test_exec_release");

        mockMvc.perform(post("/v1/requests/" + requestId + "/confirm")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}
