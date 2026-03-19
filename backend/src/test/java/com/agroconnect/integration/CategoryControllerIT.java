package com.agroconnect.integration;

import com.agroconnect.fixture.TestContainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CategoryControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listAll_shouldReturnCategoriesFromSeedData() throws Exception {
        mockMvc.perform(get("/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(9))));
    }

    @Test
    void findById_givenExistingId_shouldReturnCategory() throws Exception {
        mockMvc.perform(get("/v1/categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").isNotEmpty());
    }

    @Test
    void findById_givenNonExistentId_shouldReturn404() throws Exception {
        mockMvc.perform(get("/v1/categories/9999"))
                .andExpect(status().isNotFound());
    }
}
