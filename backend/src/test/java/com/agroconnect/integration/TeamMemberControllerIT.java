package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateTeamMemberDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateTeamMemberDto;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.TeamMemberRole;
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
class TeamMemberControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static String providerToken;
    private static String clientToken;
    private static Long memberId;

    @Test
    @Order(1)
    void setup_registerProviderAndClient() throws Exception {
        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "tm-provider@test.pt", "Password1", "Password1",
                "TM Provider", "+351922000001", "PROVIDER_MANAGER", "AgroTeam Lda", "111222300");
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated());

        User providerUser = userRepository.findByEmail("tm-provider@test.pt").orElseThrow();
        providerUser.setEmailVerified(true);
        userRepository.save(providerUser);

        MvcResult providerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("tm-provider@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "tm-client@test.pt", "Password1", "Password1",
                "TM Client", "+351911000001", "CLIENT", null, null);
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated());

        User clientUser = userRepository.findByEmail("tm-client@test.pt").orElseThrow();
        clientUser.setEmailVerified(true);
        userRepository.save(clientUser);

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("tm-client@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateTeamMemberDto dto = new CreateTeamMemberDto("Carlos Mendes", "carlos@agro.pt", "+351913000001", TeamMemberRole.OPERATOR, new java.math.BigDecimal("12.50"));

        MvcResult result = mockMvc.perform(post("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name").value("Carlos Mendes"))
                .andExpect(jsonPath("$.role").value("OPERATOR"))
                .andExpect(jsonPath("$.hourlyRate").value(12.50))
                .andReturn();
        memberId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(3)
    void list_shouldReturnTeamMembersWithHourlyRate() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Carlos Mendes"))
                .andExpect(jsonPath("$[0].hourlyRate").value(12.50));
    }

    @Test
    @Order(4)
    void create_givenClientRole_shouldReturn403() throws Exception {
        CreateTeamMemberDto dto = new CreateTeamMemberDto("Hacker", "hack@test.pt", null, TeamMemberRole.OPERATOR, null);

        mockMvc.perform(post("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(5)
    void update_shouldChangeHourlyRate() throws Exception {
        var dto = new com.agroconnect.dto.request.UpdateTeamMemberDto(
                "Carlos Mendes", "+351913000001", TeamMemberRole.LEAD,
                new java.math.BigDecimal("15.00"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                                "/v1/providers/me/team/" + memberId)
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hourlyRate").value(15.00))
                .andExpect(jsonPath("$.role").value("LEAD"));
    }

    @Test
    @Order(6)
    void create_givenNegativeHourlyRate_shouldReturn400() throws Exception {
        CreateTeamMemberDto dto = new CreateTeamMemberDto(
                "Invalid Rate", "bad@test.pt", null, TeamMemberRole.OPERATOR,
                new java.math.BigDecimal("-1.00"));

        mockMvc.perform(post("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(7)
    void getAnalytics_givenNoActivity_shouldReturnZeros() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/" + memberId + "/details")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operatorId").value(memberId))
                .andExpect(jsonPath("$.operatorName").value("Carlos Mendes"))
                .andExpect(jsonPath("$.jobsDone").value(0))
                .andExpect(jsonPath("$.hoursWorked").value(0))
                .andExpect(jsonPath("$.laborCost").value(0))
                .andExpect(jsonPath("$.revenueAttributed").value(0))
                .andExpect(jsonPath("$.profit").value(0))
                .andExpect(jsonPath("$.topMachines").isArray());
    }

    @Test
    @Order(8)
    void getAnalytics_withExplicitRange_shouldEchoRange() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/" + memberId + "/details")
                        .param("from", "2026-01-01")
                        .param("to", "2026-05-12")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("2026-01-01"))
                .andExpect(jsonPath("$.to").value("2026-05-12"));
    }

    @Test
    @Order(9)
    void getAnalytics_givenNonExistentOperator_shouldReturn404() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/9999999/details")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(10)
    void getAnalytics_givenNoToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/" + memberId + "/details"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(11)
    void getAnalytics_givenClientToken_shouldReturn403() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/" + memberId + "/details")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    void listJobs_givenNoActivity_shouldReturnEmptyPage() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/" + memberId + "/jobs")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @Order(13)
    void listJobs_givenNonExistentOperator_shouldReturn404() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/9999999/jobs")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(14)
    void listJobs_givenNoToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team/" + memberId + "/jobs"))
                .andExpect(status().isUnauthorized());
    }
}
