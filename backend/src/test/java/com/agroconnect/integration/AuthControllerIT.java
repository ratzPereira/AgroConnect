package com.agroconnect.integration;

import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RefreshTokenRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.fixture.TestContainersConfig;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String accessToken;
    private static String refreshToken;

    @Test
    @Order(1)
    void register_givenValidClientData_shouldReturn201WithTokens() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "it-test@example.pt", "password123", "password123",
                "Integration Test User", "+351999000001", "CLIENT", null, null);

        MvcResult result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.user.email").value("it-test@example.pt"))
                .andExpect(jsonPath("$.user.role").value("CLIENT"))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        accessToken = objectMapper.readTree(body).get("accessToken").asText();
        refreshToken = objectMapper.readTree(body).get("refreshToken").asText();
    }

    @Test
    @Order(2)
    void register_givenDuplicateEmail_shouldReturn409() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "it-test@example.pt", "password123", "password123",
                "Duplicate", null, "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(3)
    void login_givenValidCredentials_shouldReturn200WithTokens() throws Exception {
        LoginRequest request = new LoginRequest("it-test@example.pt", "password123");

        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        accessToken = objectMapper.readTree(body).get("accessToken").asText();
        refreshToken = objectMapper.readTree(body).get("refreshToken").asText();
    }

    @Test
    @Order(4)
    void login_givenWrongPassword_shouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("it-test@example.pt", "wrong");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    void refresh_givenValidToken_shouldReturn200WithNewTokens() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest(refreshToken);

        MvcResult result = mockMvc.perform(post("/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        accessToken = objectMapper.readTree(body).get("accessToken").asText();
        refreshToken = objectMapper.readTree(body).get("refreshToken").asText();
    }

    @Test
    @Order(6)
    void logout_givenAuthenticatedUser_shouldReturn204() throws Exception {
        mockMvc.perform(post("/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(7)
    void logout_givenNoAuth_shouldReturn401() throws Exception {
        mockMvc.perform(post("/v1/auth/logout"))
                .andExpect(status().isUnauthorized());
    }
}
