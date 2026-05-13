package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateMachineDto;
import com.agroconnect.dto.request.CreateMachineExpenseDto;
import com.agroconnect.dto.request.CreateMaintenanceLogDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateMachineDto;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ExpenseCategory;
import com.agroconnect.model.enums.MachineStatus;
import com.agroconnect.model.enums.MaintenanceType;
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
import java.time.LocalDate;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
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
class MachineControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static String providerToken;
    private static Long machineId;
    private static Long analyticsMachineId;
    private static Long maintenanceId;
    private static Long expenseId;

    @Test
    @Order(1)
    void setup_registerProvider() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "mc-provider@test.pt", "Password1", "Password1",
                "MC Provider", "+351922000002", "PROVIDER_MANAGER", "AgroMachine Lda", "222333444");
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("mc-provider@test.pt").orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);

        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("mc-provider@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        providerToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateMachineDto dto = new CreateMachineDto("Trator Ford 6610", "Trator", "80cv", "BB-11-CC", null);

        MvcResult result = mockMvc.perform(post("/v1/providers/me/machines")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andReturn();
        machineId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(3)
    void delete_givenAvailableMachine_shouldReturn409() throws Exception {
        mockMvc.perform(delete("/v1/providers/me/machines/" + machineId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(4)
    void updateAndDelete_givenRetiredMachine_shouldSucceed() throws Exception {
        UpdateMachineDto dto = new UpdateMachineDto("Trator Ford 6610", "Trator", "80cv", MachineStatus.RETIRED, "BB-11-CC", null, null);

        mockMvc.perform(put("/v1/providers/me/machines/" + machineId)
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETIRED"));

        mockMvc.perform(delete("/v1/providers/me/machines/" + machineId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNoContent());
    }

    // ─────────────────────── Phase 3 — analytics / maintenance / expenses ───────────────────────

    @Test
    @Order(5)
    void createMachine_forPhase3_shouldReturn201() throws Exception {
        CreateMachineDto dto = new CreateMachineDto("Pulverizador KS-2000", "Pulverizador", "2000L", "ZZ-99-AA", null);

        MvcResult result = mockMvc.perform(post("/v1/providers/me/machines")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();
        analyticsMachineId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(6)
    void getAnalytics_givenNoActivity_shouldReturnZeros() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/details")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineId").value(analyticsMachineId))
                .andExpect(jsonPath("$.jobsDone").value(0))
                .andExpect(jsonPath("$.revenue").value(0))
                .andExpect(jsonPath("$.maintenanceCost").value(0))
                .andExpect(jsonPath("$.expensesCost").value(0))
                .andExpect(jsonPath("$.netContribution").value(0));
    }

    @Test
    @Order(7)
    void getAnalytics_withExplicitRange_shouldEchoRange() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/details")
                        .param("from", "2026-01-01")
                        .param("to", "2026-05-12")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("2026-01-01"))
                .andExpect(jsonPath("$.to").value("2026-05-12"));
    }

    @Test
    @Order(8)
    void getAnalytics_givenNonExistentMachine_shouldReturn404() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/9999999/details")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(9)
    void getAnalytics_givenNoToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/details"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(10)
    void listJobs_givenNoActivity_shouldReturnEmptyPage() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/jobs")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @Order(11)
    void createMaintenance_givenValidData_shouldReturn201() throws Exception {
        CreateMaintenanceLogDto dto = new CreateMaintenanceLogDto(
                MaintenanceType.ROUTINE,
                "Mudança de óleo",
                new BigDecimal("120.00"),
                "Oficina Silva",
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 11, 1),
                "Filtro de óleo substituído"
        );

        MvcResult result = mockMvc.perform(post("/v1/providers/me/machines/" + analyticsMachineId + "/maintenance")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.maintenanceType").value("ROUTINE"))
                .andExpect(jsonPath("$.cost").value(120.00))
                .andReturn();
        maintenanceId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(12)
    void createMaintenance_givenInvalidPayload_shouldReturn400() throws Exception {
        // missing required fields (maintenanceType + description + performedAt)
        String invalid = "{\"cost\": 50}";
        mockMvc.perform(post("/v1/providers/me/machines/" + analyticsMachineId + "/maintenance")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalid))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(13)
    void getAnalytics_afterMaintenance_shouldReflectCostAndLastMaintenanceDate() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/details")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maintenanceCost").value(120.00))
                .andExpect(jsonPath("$.maintenanceCount").value(1))
                .andExpect(jsonPath("$.lastMaintenanceAt").value("2026-05-01"))
                .andExpect(jsonPath("$.nextMaintenanceAt").value("2026-11-01"));
    }

    @Test
    @Order(14)
    void listMaintenance_shouldReturnTheEntry() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/maintenance")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].id").value(maintenanceId));
    }

    @Test
    @Order(15)
    void createExpense_givenValidData_shouldReturn201() throws Exception {
        CreateMachineExpenseDto dto = new CreateMachineExpenseDto(
                ExpenseCategory.FUEL,
                "Reabastecimento",
                new BigDecimal("55.30"),
                LocalDate.of(2026, 5, 5),
                null
        );

        MvcResult result = mockMvc.perform(post("/v1/providers/me/machines/" + analyticsMachineId + "/expenses")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.category").value("FUEL"))
                .andExpect(jsonPath("$.amount").value(55.30))
                .andReturn();
        expenseId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(16)
    void createExpense_givenNegativeAmount_shouldReturn400() throws Exception {
        CreateMachineExpenseDto dto = new CreateMachineExpenseDto(
                ExpenseCategory.FUEL, "x", new BigDecimal("-10.00"),
                LocalDate.of(2026, 5, 5), null);

        mockMvc.perform(post("/v1/providers/me/machines/" + analyticsMachineId + "/expenses")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(17)
    void listExpenses_shouldReturnTheEntry() throws Exception {
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/expenses")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].id").value(expenseId));
    }

    @Test
    @Order(18)
    void getAnalytics_afterExpense_shouldReflectExpensesCostAndNetContribution() throws Exception {
        // revenue 0 - maintenance 120 - expenses 55.30 = -175.30
        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/details")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expensesCost").value(55.30))
                .andExpect(jsonPath("$.netContribution").value(-175.30));
    }

    @Test
    @Order(19)
    void deleteExpense_shouldReturn204AndRemove() throws Exception {
        mockMvc.perform(delete("/v1/providers/me/machines/" + analyticsMachineId + "/expenses/" + expenseId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/v1/providers/me/machines/" + analyticsMachineId + "/details")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(jsonPath("$.expensesCost").value(0));
    }

    @Test
    @Order(20)
    void deleteMaintenance_givenNonExistent_shouldReturn404() throws Exception {
        mockMvc.perform(delete("/v1/providers/me/machines/" + analyticsMachineId + "/maintenance/9999999")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(21)
    void deleteMaintenance_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/v1/providers/me/machines/" + analyticsMachineId + "/maintenance/" + maintenanceId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNoContent());
    }
}
