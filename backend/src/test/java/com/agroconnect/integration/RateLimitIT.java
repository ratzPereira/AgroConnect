package com.agroconnect.integration;

import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.fixture.TestContainersConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "agroconnect.rate-limit.enabled=true")
class RateLimitIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private StringRedisTemplate redisTemplate;

    @Test
    void login_givenExceedsRateLimit_shouldReturn429() throws Exception {
        LoginRequest request = new LoginRequest("ratelimit@test.pt", "WrongPass1");
        String body = objectMapper.writeValueAsString(request);

        // Pre-set the rate limit key to simulate exceeded limit
        // MockMvc does NOT include context-path in getRequestURI(), so path is /v1/... not /api/v1/...
        String key = "rl:127.0.0.1:POST:/v1/auth/login";
        redisTemplate.opsForValue().set(key, "100");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests());

        // Cleanup
        redisTemplate.delete(key);
    }
}
