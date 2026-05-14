package com.agroconnect.integration;

import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdminControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private static String adminToken;

    @Test
    @Order(1)
    void setup_createAdminUser() throws Exception {
        // Admin users need to be created directly (no public registration for ADMIN role)
        User admin = User.builder()
                .email("admin-it@test.pt")
                .passwordHash(passwordEncoder.encode("Password1"))
                .role(Role.ADMIN)
                .emailVerified(true)
                .active(true)
                .build();
        admin = userRepository.save(admin);
        adminToken = jwtService.generateAccessToken(admin);
    }

    @Test
    @Order(2)
    void getDashboard_givenAdmin_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers", notNullValue()))
                .andExpect(jsonPath("$.totalRequests", notNullValue()));
    }

    @Test
    @Order(3)
    void listUsers_givenAdmin_shouldReturnUsers() throws Exception {
        mockMvc.perform(get("/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(4)
    void getDashboard_givenNoAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
