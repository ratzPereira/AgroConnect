package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateMachineDto;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateMachineDto;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.enums.MachineStatus;
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
class MachineControllerIT extends TestContainersConfig {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private static String providerToken;
    private static Long machineId;

    @Test
    @Order(1)
    void setup_registerProvider() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "mc-provider@test.pt", "password123", "password123",
                "MC Provider", "+351922000002", "PROVIDER_MANAGER", "AgroMachine Lda", "222333444");
        MvcResult result = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated()).andReturn();
        providerToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    @Order(2)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateMachineDto dto = new CreateMachineDto("Trator Ford 6610", "Trator", "80cv", "BB-11-CC", null);

        MvcResult result = mockMvc.perform(post("/v1/providers/me/machines")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andReturn();
        machineId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(3)
    void delete_givenAvailableMachine_shouldReturn409() throws Exception {
        mockMvc.perform(delete("/v1/providers/me/machines/" + machineId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(4)
    void updateAndDelete_givenRetiredMachine_shouldSucceed() throws Exception {
        UpdateMachineDto dto = new UpdateMachineDto("Trator Ford 6610", "Trator", "80cv", MachineStatus.RETIRED, "BB-11-CC", null, null);

        mockMvc.perform(put("/v1/providers/me/machines/" + machineId)
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETIRED"));

        mockMvc.perform(delete("/v1/providers/me/machines/" + machineId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isNoContent());
    }
}
