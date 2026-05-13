package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.fixture.StripeTestHelper;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.ProposalService;
import com.agroconnect.service.StripeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TransactionControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProposalService proposalService;

    @MockBean
    private StripeService stripeService;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;
    private static Long proposalId;
    private static Long transactionId;

    @Test
    @Order(1)
    void setup_createRequestAndAcceptProposal() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "tx-client@test.pt", "Password1", "Password1",
                "Cliente Transacao", "+351977777777", "CLIENT", null, null);
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated());

        User clientUser = userRepository.findByEmail("tx-client@test.pt").orElseThrow();
        clientUser.setEmailVerified(true);
        userRepository.save(clientUser);

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("tx-client@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "tx-provider@test.pt", "Password1", "Password1",
                "Prestador Transacao", "+351988888888", "PROVIDER_MANAGER", "TxTest Lda", "222111000");
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated());

        User providerUser = userRepository.findByEmail("tx-provider@test.pt").orElseThrow();
        providerUser.setEmailVerified(true);
        userRepository.save(providerUser);

        StripeTestHelper.markProviderStripeReady(providerProfileRepository, providerUser.getId());

        MvcResult providerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("tx-provider@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Set provider location
        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateProviderProfileRequest(
                                null, null, null, null, null, 38.6667, -27.2167, "Terceira", "Angra do Heroismo", null))))
                .andExpect(status().isOk());

        // Create + publish request
        CreateServiceRequestDto requestDto = new CreateServiceRequestDto(
                1L, "Servico para transacoes", "Teste transacoes",
                38.6667, -27.2167, "Sao Sebastiao", "Angra do Heroismo", "Terceira",
                1.0, "hectares", Urgency.LOW, null, null, null);
        MvcResult reqResult = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated()).andReturn();
        requestId = objectMapper.readTree(reqResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // Create and accept proposal
        CreateProposalDto proposalDto = new CreateProposalDto(
                new BigDecimal("200.00"), PricingModel.FIXED, null, null,
                "Servico rapido", "Tudo incluido", null, null, null);
        MvcResult propResult = mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(proposalDto)))
                .andExpect(status().isCreated()).andReturn();
        proposalId = objectMapper.readTree(propResult.getResponse().getContentAsString()).get("id").asLong();

        StripeTestHelper.stubCreatePaymentIntent(stripeService, "pi_test_tx", "pi_test_tx_secret");
        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // payment_intent.succeeded webhook is what flips tx → HELD and runs the marketplace cascade.
        // Stripe is mocked here, so we replay those side effects directly.
        StripeTestHelper.simulateWebhookCascade(transactionRepository, proposalService, requestId);
    }

    @Test
    @Order(2)
    void listMyTransactions_asClient_shouldReturnTransactions() throws Exception {
        MvcResult result = mockMvc.perform(get("/v1/transactions/me")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("HELD"))
                .andExpect(jsonPath("$.content[0].amount").value(200.00))
                .andReturn();

        transactionId = objectMapper.readTree(result.getResponse().getContentAsString())
                .at("/content/0/id").asLong();
    }

    @Test
    @Order(3)
    void getTransaction_asProvider_shouldReturnDetail() throws Exception {
        mockMvc.perform(get("/v1/transactions/" + transactionId)
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(transactionId))
                .andExpect(jsonPath("$.status").value("HELD"))
                .andExpect(jsonPath("$.providerPayout", notNullValue()));
    }

    @Test
    @Order(4)
    void listMyTransactions_asProvider_shouldReturnTransactions() throws Exception {
        mockMvc.perform(get("/v1/transactions/me")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", greaterThan(0)));
    }
}
