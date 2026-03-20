package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateTeamMemberDto;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateTeamMemberDto;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.enums.TeamMemberRole;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TeamMemberControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private static String providerToken;
    private static String clientToken;
    private static Long memberId;

    @Test
    @Order(1)
    void setup_registerProviderAndClient() throws Exception {
        RegisterRequest providerReg = new RegisterRequest(
                "tm-provider@test.pt", "password123", "password123",
                "TM Provider", "+351922000001", "PROVIDER_MANAGER", "AgroTeam Lda", "111222333");
        MvcResult result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated()).andReturn();
        providerToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();

        RegisterRequest clientReg = new RegisterRequest(
                "tm-client@test.pt", "password123", "password123",
                "TM Client", "+351911000001", "CLIENT", null, null);
        result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated()).andReturn();
        clientToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    @Order(2)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateTeamMemberDto dto = new CreateTeamMemberDto("Carlos Mendes", "carlos@agro.pt", "+351913000001", TeamMemberRole.OPERATOR);

        MvcResult result = mockMvc.perform(post("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name").value("Carlos Mendes"))
                .andExpect(jsonPath("$.role").value("OPERATOR"))
                .andReturn();
        memberId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(3)
    void list_shouldReturnTeamMembers() throws Exception {
        mockMvc.perform(get("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Carlos Mendes"));
    }

    @Test
    @Order(4)
    void create_givenClientRole_shouldReturn403() throws Exception {
        CreateTeamMemberDto dto = new CreateTeamMemberDto("Hacker", "hack@test.pt", null, TeamMemberRole.OPERATOR);

        mockMvc.perform(post("/v1/providers/me/team")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }
}
