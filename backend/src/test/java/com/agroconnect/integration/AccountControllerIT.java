package com.agroconnect.integration;

import com.agroconnect.dto.request.DeleteAccountRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AccountControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private static String accessToken;

    @Test
    @Order(1)
    void setup_registerAndLogin() throws Exception {
        RegisterRequest register = new RegisterRequest(
                "account-it@example.pt", "Password1", "Password1",
                "Account IT User", "+351999000099", "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("account-it@example.pt")
                .orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);

        LoginRequest login = new LoginRequest("account-it@example.pt", "Password1");
        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        accessToken = objectMapper.readTree(body).get("accessToken").asText();
    }

    @Test
    @Order(2)
    void exportData_givenAuthenticated_shouldReturn200WithContentDisposition() throws Exception {
        mockMvc.perform(get("/v1/account/export")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Disposition"))
                .andExpect(jsonPath("$.user", notNullValue()))
                .andExpect(jsonPath("$.exportedAt", notNullValue()));
    }

    @Test
    @Order(3)
    void deleteAccount_givenWrongPassword_shouldReturn400() throws Exception {
        DeleteAccountRequest request = new DeleteAccountRequest("WrongPassword");

        mockMvc.perform(delete("/v1/account")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    void deleteAccount_givenNoAuth_shouldReturn401() throws Exception {
        DeleteAccountRequest request = new DeleteAccountRequest("Password1");

        mockMvc.perform(delete("/v1/account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    void deleteAccount_givenValidPassword_shouldReturn204() throws Exception {
        DeleteAccountRequest request = new DeleteAccountRequest("Password1");

        mockMvc.perform(delete("/v1/account")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }
}
