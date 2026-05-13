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

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FinanceControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static String providerToken;

    @Test
    @Order(1)
    void setup_registerProvider() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "fin-provider@test.pt", "Password1", "Password1",
                "Fin Provider", "+351922000005", "PROVIDER_MANAGER", "AgroFin Lda", "555666777");
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("fin-provider@test.pt").orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);

        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("fin-provider@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        providerToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void getSummary_shouldReturnFinancialSummary() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/summary")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue", notNullValue()))
                .andExpect(jsonPath("$.completedJobs").value(0))
                .andExpect(jsonPath("$.year", notNullValue()))
                .andExpect(jsonPath("$.yearRevenue", notNullValue()))
                .andExpect(jsonPath("$.yearNetProfit", notNullValue()))
                .andExpect(jsonPath("$.yearMargin", notNullValue()));
    }

    @Test
    @Order(3)
    void getSummary_withExplicitYear_shouldReflectRequestedYear() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/summary?year=2023")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year").value(2023));
    }

    @Test
    @Order(4)
    void getMonthlyBreakdown_shouldReturnTwelveEntries() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/monthly-breakdown?year=2025")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year").value(2025))
                .andExpect(jsonPath("$.months.length()").value(12))
                .andExpect(jsonPath("$.months[0].month").value(1))
                .andExpect(jsonPath("$.months[11].month").value(12));
    }

    @Test
    @Order(5)
    void getMonthlyBreakdown_withoutYear_shouldDefaultToCurrentYear() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/monthly-breakdown")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year", notNullValue()))
                .andExpect(jsonPath("$.months.length()").value(12));
    }

    @Test
    @Order(6)
    void getYearlyComparison_shouldReturnCurrentAndPreviousYears() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/yearly-comparison")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentYear", notNullValue()))
                .andExpect(jsonPath("$.previousYear", notNullValue()))
                .andExpect(jsonPath("$.currentRevenue", notNullValue()))
                .andExpect(jsonPath("$.previousRevenue", notNullValue()))
                .andExpect(jsonPath("$.currentJobs").value(0))
                .andExpect(jsonPath("$.previousJobs").value(0));
    }

    @Test
    @Order(7)
    void getSummary_unauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(8)
    void getMonthlyBreakdown_unauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/monthly-breakdown"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(9)
    void getYearlyComparison_unauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/yearly-comparison"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(10)
    void getSummary_givenYearBelowMinimum_shouldReturn400() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/summary?year=-1")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(11)
    void getSummary_givenYearAboveMaximum_shouldReturn400() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/summary?year=999999")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(12)
    void getSummary_givenNonNumericYear_shouldReturn400() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/summary?year=abc")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(13)
    void getMonthlyBreakdown_givenYearOutOfRange_shouldReturn400() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/monthly-breakdown?year=1500")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(14)
    void exportCsv_givenInvalidDateFormat_shouldReturn400() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/export?from=not-a-date&to=2026-01-31")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(15)
    void exportCsv_givenValidDates_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/providers/me/finance/export?from=2026-01-01&to=2026-01-31")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk());
    }
}
