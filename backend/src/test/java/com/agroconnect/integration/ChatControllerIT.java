package com.agroconnect.integration;

import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.SendMessageDto;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChatControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static String clientToken;

    @Test
    @Order(1)
    void setup_registerUsers() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "chat-client@test.pt", "Password1", "Password1",
                "Chat Client", "+351911000002", "CLIENT", null, null);
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated());

        User clientUser = userRepository.findByEmail("chat-client@test.pt").orElseThrow();
        clientUser.setEmailVerified(true);
        userRepository.save(clientUser);

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("chat-client@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void sendMessage_givenNonExistentRequest_shouldReturn404() throws Exception {
        SendMessageDto dto = new SendMessageDto("Ola!");

        mockMvc.perform(post("/v1/requests/99999/messages")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(3)
    void getMessages_givenNoAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/requests/1/messages"))
                .andExpect(status().isUnauthorized());
    }
}
