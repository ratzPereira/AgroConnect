package com.agroconnect.integration;

import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.SendMessageDto;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChatControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private static String clientToken;
    private static String providerToken;
    private static String outsiderToken;

    @Test
    @Order(1)
    void setup_registerUsers() throws Exception {
        RegisterRequest clientReg = new RegisterRequest(
                "chat-client@test.pt", "password123", "password123",
                "Chat Client", "+351911000002", "CLIENT", null, null);
        MvcResult result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated()).andReturn();
        clientToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();

        RegisterRequest providerReg = new RegisterRequest(
                "chat-provider@test.pt", "password123", "password123",
                "Chat Provider", "+351922000004", "PROVIDER_MANAGER", "ChatAgro Lda", "444555666");
        result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated()).andReturn();
        providerToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();

        RegisterRequest outsiderReg = new RegisterRequest(
                "chat-outsider@test.pt", "password123", "password123",
                "Chat Outsider", "+351911000003", "CLIENT", null, null);
        result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(outsiderReg)))
                .andExpect(status().isCreated()).andReturn();
        outsiderToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    @Order(2)
    void sendMessage_givenNonExistentRequest_shouldReturn404() throws Exception {
        SendMessageDto dto = new SendMessageDto("Olá!");

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
