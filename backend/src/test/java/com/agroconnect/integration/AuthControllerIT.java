package com.agroconnect.integration;

import com.agroconnect.dto.request.ForgotPasswordRequest;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RefreshTokenRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.ResendVerificationRequest;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @Autowired
    private UserRepository userRepository;

    private static String accessToken;
    private static String refreshToken;

    @Test
    @Order(1)
    void register_givenValidClientData_shouldReturn201WithMessage() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "it-test@example.pt", "Password1", "Password1",
                "Integration Test User", "+351999000001", "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", notNullValue()));
    }

    @Test
    @Order(2)
    void register_givenDuplicateEmail_shouldReturn409() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "it-test@example.pt", "Password1", "Password1",
                "Duplicate", null, "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(3)
    void login_givenUnverifiedEmail_shouldReturn403() throws Exception {
        LoginRequest request = new LoginRequest("it-test@example.pt", "Password1");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(4)
    void setup_verifyEmailDirectly() {
        // Manually set emailVerified = true so subsequent login tests work
        User user = userRepository.findByEmail("it-test@example.pt")
                .orElseThrow(() -> new AssertionError("Test user not found"));
        user.setEmailVerified(true);
        userRepository.save(user);
        assertTrue(userRepository.findByEmail("it-test@example.pt")
                .map(User::isEmailVerified).orElse(false));
    }

    @Test
    @Order(5)
    void login_givenValidCredentials_shouldReturn200WithTokens() throws Exception {
        LoginRequest request = new LoginRequest("it-test@example.pt", "Password1");

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
    @Order(6)
    void login_givenWrongPassword_shouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("it-test@example.pt", "wrong");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(7)
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
    @Order(8)
    void logout_givenAuthenticatedUser_shouldReturn204() throws Exception {
        mockMvc.perform(post("/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(9)
    void logout_givenNoAuth_shouldReturn401() throws Exception {
        mockMvc.perform(post("/v1/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(10)
    void forgotPassword_givenAnyEmail_shouldReturn200() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("it-test@example.pt");

        mockMvc.perform(post("/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", notNullValue()));
    }

    @Test
    @Order(11)
    void resendVerification_givenAnyEmail_shouldReturn200() throws Exception {
        ResendVerificationRequest request = new ResendVerificationRequest("it-test@example.pt");

        mockMvc.perform(post("/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", notNullValue()));
    }
}
