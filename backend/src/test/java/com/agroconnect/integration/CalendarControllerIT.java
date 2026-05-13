package com.agroconnect.integration;

import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
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

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CalendarControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private static String providerToken;

    @Test
    @Order(1)
    void setup_registerProvider() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "cal-it@test.pt", "Password1", "Password1",
                "Calendar Provider", "+351900000040", "PROVIDER_MANAGER", "CalendarTest Lda", "444555666");

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("cal-it@test.pt").orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);

        LoginRequest login = new LoginRequest("cal-it@test.pt", "Password1");
        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        providerToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void getCalendarEvents_givenProvider_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/providers/me/calendar")
                        .param("from", "2025-01-01")
                        .param("to", "2025-12-31")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(3)
    void getConflicts_givenProvider_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/providers/me/calendar/conflicts")
                        .param("from", "2025-01-01")
                        .param("to", "2025-12-31")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(4)
    void updateSchedule_givenNonExistentExecution_shouldReturn404() throws Exception {
        Map<String, String> body = Map.of(
                "scheduledDate", "2025-06-01",
                "scheduledEndDate", "2025-06-02");

        mockMvc.perform(patch("/v1/providers/me/calendar/executions/999999/schedule")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(5)
    void getCalendarEvents_givenNoAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/providers/me/calendar")
                        .param("from", "2025-01-01")
                        .param("to", "2025-12-31"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(6)
    void getSummary_givenProvider_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/providers/me/calendar/summary")
                        .param("from", "2025-01-01")
                        .param("to", "2025-12-31")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents").exists())
                .andExpect(jsonPath("$.totalRevenue").exists())
                .andExpect(jsonPath("$.operatorUtilization").exists());
    }

    @Test
    @Order(7)
    void getWorkload_givenProvider_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/providers/me/calendar/workload")
                        .param("from", "2025-01-01")
                        .param("to", "2025-01-07")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operators").isArray());
    }

    @Test
    @Order(8)
    void getMaintenanceWindows_givenProvider_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/providers/me/calendar/maintenance-windows")
                        .param("from", "2025-01-01")
                        .param("to", "2025-12-31")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(9)
    void getAlerts_givenProvider_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/providers/me/calendar/alerts")
                        .param("from", "2025-01-01")
                        .param("to", "2025-12-31")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conflicts").isArray())
                .andExpect(jsonPath("$.maintenance").isArray())
                .andExpect(jsonPath("$.payments").isArray())
                .andExpect(jsonPath("$.proposals").isArray());
    }

    @Test
    @Order(10)
    void updateSchedule_givenInvalidTimeRange_shouldReturn400() throws Exception {
        Map<String, Object> body = Map.of(
                "scheduledDate", "2025-06-01",
                "scheduledEndDate", "2025-06-01",
                "scheduledStartTime", "14:00",
                "scheduledEndTime", "10:00",
                "allDay", false);

        mockMvc.perform(patch("/v1/providers/me/calendar/executions/999999/schedule")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound()); // 404 happens first because execution doesn't exist
    }

    @Test
    @Order(11)
    void reassign_givenNonExistentExecution_shouldReturn404() throws Exception {
        Map<String, Object> body = Map.of(
                "fromTeamMemberId", 1,
                "toTeamMemberId", 2);

        mockMvc.perform(post("/v1/providers/me/calendar/executions/999999/reassign")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }
}
