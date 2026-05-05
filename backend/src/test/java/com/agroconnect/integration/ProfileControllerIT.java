package com.agroconnect.integration;

import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateClientProfileRequest;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProfileControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private static String clientToken;
    private static String providerToken;

    @Test
    @Order(1)
    void setup_registerClientAndProvider() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "prof-client@test.pt", "Password1", "Password1",
                "Profile Client", "+351900000030", "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated());

        User clientUser = userRepository.findByEmail("prof-client@test.pt").orElseThrow();
        clientUser.setEmailVerified(true);
        userRepository.save(clientUser);

        LoginRequest clientLogin = new LoginRequest("prof-client@test.pt", "Password1");
        MvcResult clientResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientLogin)))
                .andExpect(status().isOk())
                .andReturn();

        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "prof-provider@test.pt", "Password1", "Password1",
                "Profile Provider", "+351900000031", "PROVIDER_MANAGER", "ProfileTest Lda", "111222311");

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated());

        User providerUser = userRepository.findByEmail("prof-provider@test.pt").orElseThrow();
        providerUser.setEmailVerified(true);
        userRepository.save(providerUser);

        LoginRequest providerLogin = new LoginRequest("prof-provider@test.pt", "Password1");
        MvcResult providerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerLogin)))
                .andExpect(status().isOk())
                .andReturn();

        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void getMyProfile_givenClient_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/profile/me")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @Order(3)
    void getMyProfile_givenProvider_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/profile/me")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @Order(4)
    void updateClientProfile_givenValidData_shouldReturn200() throws Exception {
        UpdateClientProfileRequest dto = new UpdateClientProfileRequest(
                "Profile Client Updated", "+351900000032",
                "Sé", "Angra do Heroísmo", "Terceira",
                38.6667, -27.2167);

        mockMvc.perform(put("/v1/profile/me/client")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Profile Client Updated"));
    }

    @Test
    @Order(5)
    void updateProviderProfile_givenValidData_shouldReturn200() throws Exception {
        UpdateProviderProfileRequest dto = new UpdateProviderProfileRequest(
                "ProfileTest Updated Lda", "111222311",
                "+351900000033", "Serviços agrícolas de teste",
                30.0, 38.6667, -27.2167,
                "Terceira", "Angra do Heroísmo", "São Pedro");

        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("ProfileTest Updated Lda"));
    }

    @Test
    @Order(6)
    void updateProviderProfile_givenClientToken_shouldReturn403() throws Exception {
        UpdateProviderProfileRequest dto = new UpdateProviderProfileRequest(
                "Hack Lda", "999999999",
                "+351900000034", "Unauthorized",
                10.0, 38.6667, -27.2167,
                "Terceira", "Angra do Heroísmo", "Sé");

        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(7)
    void getMyProfile_givenNoAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/profile/me"))
                .andExpect(status().isUnauthorized());
    }
}
