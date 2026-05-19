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
import com.agroconnect.repository.UserRepository;
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

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProposalControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @MockBean
    private StripeService stripeService;

    private static String clientToken;
    private static String providerToken;
    private static Long requestId;
    private static Long proposalId;

    @Test
    @Order(1)
    void setup_registerUsersAndCreateRequest() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "prop-client@test.pt", "Password1", "Password1",
                "Cliente Propostas", "+351933333333", "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated());

        User clientUser = userRepository.findByEmail("prop-client@test.pt").orElseThrow();
        clientUser.setEmailVerified(true);
        userRepository.save(clientUser);

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("prop-client@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "prop-provider@test.pt", "Password1", "Password1",
                "Prestador Propostas", "+351944444444", "PROVIDER_MANAGER", "PropostasTeste Lda", "888777666");

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated());

        User providerUser = userRepository.findByEmail("prop-provider@test.pt").orElseThrow();
        providerUser.setEmailVerified(true);
        userRepository.save(providerUser);

        // Mark provider as Stripe-ready (charges enabled) so accept can create a PaymentIntent
        StripeTestHelper.markProviderStripeReady(providerProfileRepository, providerUser.getId());

        MvcResult providerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("prop-provider@test.pt", "Password1"))))
                .andExpect(status().isOk())
                .andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Set provider location (needed for radius checks)
        UpdateProviderProfileRequest profileUpdate = new UpdateProviderProfileRequest(
                null, null, null, null, null, 38.6667, -27.2167, "Terceira", "Angra do Heroísmo", null);
        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileUpdate)))
                .andExpect(status().isOk());

        // Create and publish a service request
        CreateServiceRequestDto requestDto = new CreateServiceRequestDto(
                1L, "Serviço para propostas", "Teste de propostas completas",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                3.0, "hectares", Urgency.HIGH, null, null, null);

        MvcResult requestResult = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andReturn();
        requestId = objectMapper.readTree(requestResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Publish the request
        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    @Order(2)
    void createProposal_givenValidData_shouldReturn201() throws Exception {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("350.00"), PricingModel.FIXED, null, null,
                "Executo com trator de 150cv", "Combustível e operador incluídos",
                "Remoção de pedras", null, null);

        MvcResult result = mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.price").value(350.00))
                .andReturn();

        proposalId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    @Order(3)
    void createProposal_givenDuplicate_shouldReturn409() throws Exception {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("400.00"), PricingModel.FIXED, null, null,
                "Segunda tentativa", null, null, null, null);

        mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(4)
    void createProposal_givenClientRole_shouldReturn403() throws Exception {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("100.00"), null, null, null, "Test", null, null, null, null);

        mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(5)
    void listByRequest_shouldReturnProposals() throws Exception {
        mockMvc.perform(get("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(proposalId));
    }

    @Test
    @Order(6)
    void verifyRequestStatusAfterProposal_shouldBeWithProposals() throws Exception {
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITH_PROPOSALS"));
    }

    @Test
    @Order(7)
    void acceptProposal_shouldCreatePaymentIntentAndKeepRequestWithProposals() throws Exception {
        StripeTestHelper.stubCreatePaymentIntent(stripeService, "pi_test_it_accept", "pi_test_it_accept_secret_xyz");

        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proposalId").value(proposalId))
                .andExpect(jsonPath("$.transactionId", notNullValue()))
                .andExpect(jsonPath("$.paymentIntentId").value("pi_test_it_accept"))
                .andExpect(jsonPath("$.clientSecret").value("pi_test_it_accept_secret_xyz"))
                .andExpect(jsonPath("$.amount").value(350.00))
                .andExpect(jsonPath("$.publishableKey", notNullValue()));

        // Cascade is deferred to payment_intent.succeeded webhook — request must remain WITH_PROPOSALS
        mockMvc.perform(get("/v1/requests/" + requestId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITH_PROPOSALS"));
    }

    @Test
    @Order(8)
    void acceptProposal_givenSameProposalPaymentInProgress_shouldResumeExistingIntent() throws Exception {
        // Order(7) initiated payment for this proposal. The client backed out without
        // paying and clicked accept again — we must return the SAME PaymentIntent so the
        // Stripe Elements modal resumes seamlessly (not 409, which is a UX dead-end).
        // @MockBean is reset between test methods, so we must re-stub retrievePaymentIntent
        // for the intent that Order(7) created in the DB.
        StripeTestHelper.stubCreatePaymentIntent(stripeService, "pi_test_it_accept", "pi_test_it_accept_secret_xyz");

        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentIntentId").value("pi_test_it_accept"))
                .andExpect(jsonPath("$.clientSecret").value("pi_test_it_accept_secret_xyz"));
    }

    @Test
    @Order(9)
    void listMyProposals_shouldReturnProviderProposals() throws Exception {
        mockMvc.perform(get("/v1/proposals/mine")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(proposalId));
    }
}
