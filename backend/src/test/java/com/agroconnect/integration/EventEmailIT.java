package com.agroconnect.integration;

import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.request.CreateReviewDto;
import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.DisputeRequestDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.ResolveDisputeDto;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.event.DisputeOpenedEvent;
import com.agroconnect.event.DisputeResolvedEvent;
import com.agroconnect.event.PaymentReleasedEvent;
import com.agroconnect.event.ProposalAcceptedEvent;
import com.agroconnect.event.ProposalReceivedEvent;
import com.agroconnect.event.RatingReceivedEvent;
import com.agroconnect.event.RequestExpiredEvent;
import com.agroconnect.event.WorkMarkedCompleteEvent;
import com.agroconnect.fixture.StripeTestHelper;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.scheduler.RequestExpirationJob;
import com.agroconnect.service.EmailService;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end verification that each of the 8 application events fires the corresponding
 * EmailService method via the @TransactionalEventListener AFTER_COMMIT hook. EmailService
 * is mocked so we do not actually call the Resend HTTP API; we only verify the delegation.
 *
 * The listener runs on the @Async emailExecutor thread, so we use Mockito's timeout()
 * verification to wait for the async call (up to 5s).
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class EventEmailIT extends TestContainersConfig {

    private static final long ASYNC_TIMEOUT_MS = 5000;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ProviderProfileRepository providerProfileRepository;
    @Autowired private ServiceRequestRepository serviceRequestRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private ProposalService proposalService;
    @Autowired private com.agroconnect.service.TransactionService transactionService;
    @Autowired private com.agroconnect.service.ServiceRequestService serviceRequestService;
    @Autowired private RequestExpirationJob requestExpirationJob;

    @MockBean private StripeService stripeService;
    @MockBean private EmailService emailService;

    private static String clientToken;
    private static String providerToken;
    private static Long clientUserId;
    private static Long providerUserId;
    private static Long requestId;
    private static Long proposalId;
    private static Long executionId;

    // ===== Setup: register two users, profile, and create a request =====

    @Test
    @Order(1)
    void setup_registerUsersAndPublishRequest() throws Exception {
        // Register client
        RegisterRequest clientReg = new RegisterRequest(
                "evt-client@test.pt", "Password1", "Password1",
                "Cliente Eventos", "+351933000111", "CLIENT", null, null);
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReg)))
                .andExpect(status().isCreated());

        User clientUser = userRepository.findByEmail("evt-client@test.pt").orElseThrow();
        clientUser.setEmailVerified(true);
        userRepository.save(clientUser);
        clientUserId = clientUser.getId();

        MvcResult clientResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("evt-client@test.pt", "Password1"))))
                .andExpect(status().isOk()).andReturn();
        clientToken = objectMapper.readTree(clientResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register provider
        RegisterRequest providerReg = new RegisterRequest(
                "evt-provider@test.pt", "Password1", "Password1",
                "Prestador Eventos", "+351944000222", "PROVIDER_MANAGER", "EventosTeste Lda", "988777666");
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(providerReg)))
                .andExpect(status().isCreated());

        User providerUser = userRepository.findByEmail("evt-provider@test.pt").orElseThrow();
        providerUser.setEmailVerified(true);
        userRepository.save(providerUser);
        providerUserId = providerUser.getId();

        StripeTestHelper.markProviderStripeReady(providerProfileRepository, providerUser.getId());

        MvcResult providerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("evt-provider@test.pt", "Password1"))))
                .andExpect(status().isOk()).andReturn();
        providerToken = objectMapper.readTree(providerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Set provider location
        UpdateProviderProfileRequest profileUpdate = new UpdateProviderProfileRequest(
                null, null, null, null, null, 38.6667, -27.2167, "Terceira", "Angra do Heroísmo", null);
        mockMvc.perform(put("/v1/profile/me/provider")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileUpdate)))
                .andExpect(status().isOk());

        // Create and publish a request
        CreateServiceRequestDto requestDto = new CreateServiceRequestDto(
                1L, "Pedido para eventos", "Verificar disparo de eventos",
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                2.0, "hectares", Urgency.MEDIUM, null, null, null);
        MvcResult reqResult = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated()).andReturn();
        requestId = objectMapper.readTree(reqResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/v1/requests/" + requestId + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());
    }

    // ===== 1. ProposalReceivedEvent (controller IT) =====

    @Test
    @Order(2)
    void createProposal_shouldFireProposalReceivedEmail() throws Exception {
        CreateProposalDto dto = new CreateProposalDto(
                new BigDecimal("450.00"), PricingModel.FIXED, null, null,
                "Lavoura completa com trator", "Tudo incluído", null, null, null);

        MvcResult propResult = mockMvc.perform(post("/v1/requests/" + requestId + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated()).andReturn();
        proposalId = objectMapper.readTree(propResult.getResponse().getContentAsString()).get("id").asLong();

        verify(emailService, timeout(ASYNC_TIMEOUT_MS)).sendProposalReceivedEmail(any(ProposalReceivedEvent.class));
    }

    // ===== 2. ProposalAcceptedEvent (service-layer IT — bypasses Stripe webhook) =====

    @Test
    @Order(3)
    void completeAcceptance_shouldFireProposalAcceptedEmail() throws Exception {
        StripeTestHelper.stubCreatePaymentIntent(stripeService, "pi_test_evt_accept", "pi_test_evt_accept_secret");

        // Initiate acceptance (creates PENDING transaction + PaymentIntent)
        mockMvc.perform(post("/v1/proposals/" + proposalId + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // Replay payment_intent.succeeded webhook side effects
        StripeTestHelper.simulateWebhookCascade(transactionRepository, proposalService, requestId);

        verify(emailService, timeout(ASYNC_TIMEOUT_MS)).sendProposalAcceptedEmail(any(ProposalAcceptedEvent.class));
    }

    // ===== 3. WorkMarkedCompleteEvent (controller-IT after check-in) =====

    @Test
    @Order(4)
    void completeExecution_shouldFireWorkMarkedCompleteEmail() throws Exception {
        // Fetch execution id
        MvcResult execResult = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/v1/executions/request/" + requestId)
                                .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk()).andReturn();
        executionId = objectMapper.readTree(execResult.getResponse().getContentAsString()).get("id").asLong();

        // Check-in
        mockMvc.perform(post("/v1/executions/" + executionId + "/checkin")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CheckinExecutionDto(38.6667, -27.2167))))
                .andExpect(status().isOk());

        // Complete
        mockMvc.perform(post("/v1/executions/" + executionId + "/complete")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CompleteExecutionDto("Tudo concluído", null))))
                .andExpect(status().isOk());

        verify(emailService, timeout(ASYNC_TIMEOUT_MS)).sendWorkMarkedCompleteEmail(any(WorkMarkedCompleteEvent.class));
    }

    // ===== 4. PaymentReleasedEvent (client confirms → release transfer) =====

    @Test
    @Order(5)
    void confirmRequest_shouldFirePaymentReleasedEmail() throws Exception {
        StripeTestHelper.stubCreateTransfer(stripeService, "tr_test_evt_release");

        mockMvc.perform(post("/v1/requests/" + requestId + "/confirm")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        verify(emailService, timeout(ASYNC_TIMEOUT_MS)).sendPaymentReleasedEmail(any(PaymentReleasedEvent.class));
    }

    // ===== 5. RatingReceivedEvent (client reviews provider) =====

    @Test
    @Order(6)
    void createReview_shouldFireRatingReceivedEmail() throws Exception {
        CreateReviewDto dto = new CreateReviewDto(5, "Trabalho excelente, muito profissional e pontual.");

        mockMvc.perform(post("/v1/requests/" + requestId + "/reviews")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        verify(emailService, timeout(ASYNC_TIMEOUT_MS)).sendRatingReceivedEmail(any(RatingReceivedEvent.class));
    }

    // ===== 6 & 7. Dispute open + resolve (service-layer IT with separate request) =====

    @Test
    @Order(7)
    void disputeAndResolve_shouldFireDisputeOpenedAndResolvedEmails() throws Exception {
        // We need a SECOND request that we drive all the way to AWAITING_CONFIRMATION
        // so we can dispute it. The earlier request (Order 5) was already COMPLETED.
        Long disputeRequestId = setupSecondRequestUpToAwaitingConfirmation();

        // ----- Dispute opened by client -----
        authenticateAs(clientUserId, "CLIENT");
        try {
            serviceRequestService.dispute(disputeRequestId,
                    new DisputeRequestDto("Trabalho não foi realizado conforme acordado."),
                    clientUserId);
        } finally {
            SecurityContextHolder.clearContext();
        }

        verify(emailService, timeout(ASYNC_TIMEOUT_MS)).sendDisputeOpenedEmail(any(DisputeOpenedEvent.class));

        // ----- Dispute resolved by admin (REFUND path returns money to client) -----
        StripeTestHelper.stubCreateRefund(stripeService, "re_test_evt_dispute");
        serviceRequestService.resolveDispute(disputeRequestId,
                new ResolveDisputeDto(ResolveDisputeDto.Resolution.REFUND, "Dispute upheld for the client."));

        // Two events published — one per recipient. timeout() needs at least 1 invocation.
        verify(emailService, timeout(ASYNC_TIMEOUT_MS).atLeastOnce())
                .sendDisputeResolvedEmail(any(DisputeResolvedEvent.class));
    }

    // ===== 8. RequestExpiredEvent (scheduler job fires email per request) =====

    @Test
    @Order(8)
    void expirePublishedRequests_shouldFireRequestExpiredEmail() throws Exception {
        // Create yet another PUBLISHED request, force its expires_at into the past, then
        // run the scheduler job.
        Long expRequestId = createPublishedRequest("Pedido prestes a expirar",
                "Teste de expiração — deve disparar email.");
        forceRequestExpiredAt(expRequestId, Instant.now().minus(1, ChronoUnit.DAYS));

        requestExpirationJob.expirePublishedRequests();

        verify(emailService, timeout(ASYNC_TIMEOUT_MS).atLeastOnce())
                .sendRequestExpiredEmail(any(RequestExpiredEvent.class));
    }

    // ===== Helpers =====

    private Long createPublishedRequest(String title, String description) throws Exception {
        CreateServiceRequestDto dto = new CreateServiceRequestDto(
                1L, title, description,
                38.6667, -27.2167, "São Sebastião", "Angra do Heroísmo", "Terceira",
                1.5, "hectares", Urgency.LOW, null, null, null);
        MvcResult result = mockMvc.perform(post("/v1/requests")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated()).andReturn();
        Long id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(post("/v1/requests/" + id + "/publish")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());
        return id;
    }

    @Transactional
    void forceRequestExpiredAt(Long id, Instant when) {
        ServiceRequest sr = serviceRequestRepository.findById(id).orElseThrow();
        sr.setExpiresAt(when);
        serviceRequestRepository.save(sr);
    }

    private Long setupSecondRequestUpToAwaitingConfirmation() throws Exception {
        // Create + publish request
        Long id = createPublishedRequest("Pedido para disputa", "Teste de disputa de execução.");

        // Provider submits proposal
        CreateProposalDto pd = new CreateProposalDto(
                new BigDecimal("300.00"), PricingModel.FIXED, null, null,
                "Vou fazer o serviço", "Incluído", null, null, null);
        MvcResult propResult = mockMvc.perform(post("/v1/requests/" + id + "/proposals")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pd)))
                .andExpect(status().isCreated()).andReturn();
        Long pid = objectMapper.readTree(propResult.getResponse().getContentAsString()).get("id").asLong();

        // Client accepts (deferred — finalised by webhook simulation)
        StripeTestHelper.stubCreatePaymentIntent(stripeService, "pi_test_evt_dispute_" + id, "pi_secret_evt_dispute_" + id);
        mockMvc.perform(post("/v1/proposals/" + pid + "/accept")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());
        StripeTestHelper.simulateWebhookCascade(transactionRepository, proposalService, id);

        // Provider checks in + completes (→ AWAITING_CONFIRMATION)
        MvcResult execResult = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/v1/executions/request/" + id)
                                .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk()).andReturn();
        Long eid = objectMapper.readTree(execResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/v1/executions/" + eid + "/checkin")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CheckinExecutionDto(38.6667, -27.2167))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/v1/executions/" + eid + "/complete")
                        .header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CompleteExecutionDto("Pronto", null))))
                .andExpect(status().isOk());

        return id;
    }

    private void authenticateAs(Long userId, String role) {
        // Service-layer call bypasses MockMvc; populate SecurityContext so any @PreAuthorize
        // annotations on the service path don't reject the call.
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }
}
