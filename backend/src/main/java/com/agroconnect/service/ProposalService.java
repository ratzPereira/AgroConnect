package com.agroconnect.service;

import com.agroconnect.config.StripeProperties;
import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.response.ProposalAcceptResponse;
import com.agroconnect.dto.response.ProposalResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.mapper.ProposalMapper;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.stripe.model.PaymentIntent;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProposalService {

    private static final Logger log = LoggerFactory.getLogger(ProposalService.class);

    private static final Set<RequestStatus> ACCEPTING_PROPOSALS = EnumSet.of(
            RequestStatus.PUBLISHED, RequestStatus.WITH_PROPOSALS);

    // Stripe PaymentIntent statuses where the existing intent can still be paid by the
    // client (Elements will resume from the same clientSecret). Anything else is dead
    // and must be replaced. See https://stripe.com/docs/payments/paymentintents/lifecycle.
    private static final Set<String> RESUMABLE_PI_STATUSES = Set.of(
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "processing");

    private static final String ERR_REQUEST_NOT_FOUND = "Pedido de serviço não encontrado.";
    private static final String ERR_PROPOSAL_NOT_FOUND = "Proposta não encontrada.";
    private static final String ERR_PROVIDER_PROFILE_NOT_FOUND = "Perfil de prestador não encontrado.";

    private final ProposalRepository proposalRepository;
    private final ServiceRequestRepository requestRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final ExecutionService executionService;
    private final StripeService stripeService;
    private final StripeProperties stripeProperties;
    private final EntityManager entityManager;
    private final ApplicationEventPublisher eventPublisher;
    private final UserDisplayNameResolver nameResolver;

    @Value("${agroconnect.commission.rate}")
    private BigDecimal commissionRate;

    @Transactional
    public ProposalResponse create(Long requestId, CreateProposalDto dto, Long userId) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_REQUEST_NOT_FOUND));

        if (!ACCEPTING_PROPOSALS.contains(request.getStatus())) {
            throw new InvalidStateException("Este pedido não está a aceitar propostas.");
        }

        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROVIDER_PROFILE_NOT_FOUND));

        if (proposalRepository.existsByRequestIdAndProviderId(requestId, provider.getId())) {
            throw new InvalidStateException("Já submeteu uma proposta para este pedido.");
        }

        Proposal proposal = Proposal.builder()
                .request(request)
                .provider(provider)
                .status(ProposalStatus.PENDING)
                .price(dto.price())
                .pricingModel(dto.pricingModel() != null ? dto.pricingModel() : PricingModel.FIXED)
                .unitPrice(dto.unitPrice())
                .estimatedUnits(dto.estimatedUnits())
                .description(dto.description())
                .includesText(dto.includesText())
                .excludesText(dto.excludesText())
                .estimatedDate(dto.estimatedDate())
                .validUntil(dto.validUntil())
                .build();

        proposal = proposalRepository.save(proposal);

        // First proposal transitions request to WITH_PROPOSALS
        if (request.getStatus() == RequestStatus.PUBLISHED) {
            request.setStatus(RequestStatus.WITH_PROPOSALS);
            requestRepository.save(request);
        }

        notificationService.create(
                request.getClient().getId(),
                "NEW_PROPOSAL",
                "Nova proposta recebida",
                "Recebeu uma nova proposta de " + provider.getCompanyName() + " para o pedido \"" + request.getTitle() + "\".",
                requestIdPayload(request.getId())
        );

        log.info("Proposal created: {} for request {} by provider {}", proposal.getId(), requestId, provider.getId());

        eventPublisher.publishEvent(new com.agroconnect.event.ProposalReceivedEvent(
                request.getId(),
                proposal.getId(),
                request.getClient().getId(),
                request.getClient().getEmail(),
                nameResolver.resolve(request.getClient()),
                provider.getCompanyName(),
                request.getTitle(),
                Instant.now()));

        return ProposalMapper.toResponse(proposal);
    }

    /**
     * Initiates acceptance: validates, creates an escrow transaction in PENDING state and a
     * Stripe PaymentIntent. The acceptance only completes — proposal moves to ACCEPTED, request
     * to AWARDED, other proposals to REJECTED, execution row created — when the
     * {@code payment_intent.succeeded} webhook fires and invokes
     * {@link #completeAcceptanceAfterPayment(Long)}.
     */
    @Transactional
    public ProposalAcceptResponse accept(Long proposalId, Long userId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROPOSAL_NOT_FOUND));

        ServiceRequest request = proposal.getRequest();

        entityManager.lock(request, LockModeType.PESSIMISTIC_WRITE);
        // Refresh AFTER lock — Hibernate's lock() does not re-read entity state.
        // Without this, status checks below would use a snapshot taken before another
        // transaction could have transitioned the request.
        entityManager.refresh(request);
        entityManager.refresh(proposal);

        if (!request.getClient().getId().equals(userId)) {
            throw new ForbiddenException("Não tem permissão para aceitar esta proposta.");
        }

        if (request.getStatus() != RequestStatus.WITH_PROPOSALS) {
            throw new InvalidStateException("O pedido não está no estado correto para aceitar propostas.");
        }

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new InvalidStateException("Só é possível aceitar propostas pendentes.");
        }

        if (proposal.getValidUntil() != null && proposal.getValidUntil().isBefore(Instant.now())) {
            throw new InvalidStateException("Esta proposta expirou e não pode ser aceite.");
        }

        ProviderProfile provider = proposal.getProvider();
        if (provider.getStripeAccountId() == null || !provider.isStripeChargesEnabled()) {
            throw new InvalidStateException(
                    "O prestador ainda não concluiu a configuração de pagamentos. Tente outra proposta.");
        }

        Optional<Transaction> existingTx = transactionRepository.findByRequestId(request.getId());
        if (existingTx.isPresent()) {
            Transaction prev = existingTx.get();
            if (prev.getStatus() != TransactionStatus.PENDING) {
                // HELD / RELEASED / REFUNDED — the WITH_PROPOSALS check above should have
                // caught this already, but be defensive.
                throw new InvalidStateException(
                        "Já existe um pagamento em curso para este pedido. Conclua-o ou cancele-o antes de aceitar outra proposta.");
            }

            PaymentIntent prevIntent = stripeService.retrievePaymentIntent(prev.getStripePaymentIntentId());
            boolean sameProposal = prev.getProposal().getId().equals(proposalId);
            boolean resumable = RESUMABLE_PI_STATUSES.contains(prevIntent.getStatus());

            if (sameProposal && resumable) {
                // Client clicked accept, closed the modal without paying, then clicked
                // accept again — return the same intent so Elements resumes seamlessly.
                log.info("Resuming acceptance for proposal {} (transaction {}, paymentIntent {} status={})",
                        proposalId, prev.getId(), prevIntent.getId(), prevIntent.getStatus());
                return new ProposalAcceptResponse(
                        prev.getId(),
                        proposal.getId(),
                        prevIntent.getId(),
                        prevIntent.getClientSecret(),
                        prev.getAmount(),
                        stripeProperties.publishableKey()
                );
            }

            // Switched to a different proposal, or the previous intent is dead. Cancel the
            // old intent in Stripe (if still alive) and drop the orphan row before creating
            // a fresh transaction below.
            if (resumable) {
                stripeService.cancelPaymentIntent(prevIntent.getId());
            }
            log.info("Discarding orphan transaction {} (paymentIntent {} status={}, sameProposal={})",
                    prev.getId(), prevIntent.getId(), prevIntent.getStatus(), sameProposal);
            transactionRepository.delete(prev);
            transactionRepository.flush();
        }

        BigDecimal amount = proposal.getPrice();
        BigDecimal commission = amount.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal payout = amount.subtract(commission);

        Transaction transaction = Transaction.builder()
                .request(request)
                .proposal(proposal)
                .amount(amount)
                .commissionRate(commissionRate)
                .commissionAmount(commission)
                .providerPayout(payout)
                .status(TransactionStatus.PENDING)
                .build();
        transaction = transactionRepository.save(transaction);

        PaymentIntent intent = stripeService.createPaymentIntent(
                transaction.getId(),
                amount,
                request.getClient().getEmail(),
                request.getId(),
                proposal.getId()
        );

        transaction.setStripePaymentIntentId(intent.getId());
        transactionRepository.save(transaction);

        log.info("Proposal {} acceptance initiated: transaction={}, paymentIntent={}",
                proposalId, transaction.getId(), intent.getId());

        return new ProposalAcceptResponse(
                transaction.getId(),
                proposal.getId(),
                intent.getId(),
                intent.getClientSecret(),
                amount,
                stripeProperties.publishableKey()
        );
    }

    /**
     * Completes the acceptance cascade after Stripe confirms the payment. Idempotent:
     * if the request is no longer in WITH_PROPOSALS, this is a duplicate webhook delivery
     * and the method returns silently.
     */
    @Transactional
    public void completeAcceptanceAfterPayment(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada."));

        Proposal proposal = transaction.getProposal();
        ServiceRequest request = transaction.getRequest();

        entityManager.lock(request, LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(request);

        if (request.getStatus() != RequestStatus.WITH_PROPOSALS) {
            log.info("completeAcceptanceAfterPayment: request {} already in {} — skipping cascade",
                    request.getId(), request.getStatus());
            return;
        }

        proposal.setStatus(ProposalStatus.ACCEPTED);
        proposalRepository.save(proposal);

        proposalRepository.rejectAllPendingExcept(request.getId(), proposal.getId());

        request.setStatus(RequestStatus.AWARDED);
        requestRepository.save(request);

        executionService.createForProposal(proposal);

        notificationService.create(
                proposal.getProvider().getUser().getId(),
                "PROPOSAL_ACCEPTED",
                "Proposta aceite",
                "A sua proposta para o pedido \"" + request.getTitle() + "\" foi aceite e o pagamento está em escrow.",
                requestIdPayload(request.getId())
        );

        List<Proposal> rejected = proposalRepository.findByRequestId(request.getId()).stream()
                .filter(p -> p.getStatus() == ProposalStatus.REJECTED)
                .toList();
        for (Proposal r : rejected) {
            notificationService.create(
                    r.getProvider().getUser().getId(),
                    "PROPOSAL_REJECTED",
                    "Proposta não selecionada",
                    "A sua proposta para o pedido \"" + request.getTitle() + "\" não foi selecionada.",
                    requestIdPayload(request.getId())
            );
        }

        eventPublisher.publishEvent(new com.agroconnect.event.ProposalAcceptedEvent(
                request.getId(),
                proposal.getId(),
                proposal.getProvider().getUser().getId(),
                proposal.getProvider().getUser().getEmail(),
                proposal.getProvider().getCompanyName(),
                nameResolver.resolve(request.getClient()),
                request.getTitle(),
                proposal.getPrice(),
                Instant.now()));

        log.info("Acceptance cascade completed for proposal {} (transaction {})",
                proposal.getId(), transactionId);
    }

    @Transactional
    public ProposalResponse withdraw(Long proposalId, Long userId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROPOSAL_NOT_FOUND));

        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROVIDER_PROFILE_NOT_FOUND));

        if (!proposal.getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenException("Não tem permissão para retirar esta proposta.");
        }

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new InvalidStateException("Só é possível retirar propostas pendentes.");
        }

        proposal.setStatus(ProposalStatus.WITHDRAWN);
        proposalRepository.save(proposal);

        log.info("Proposal withdrawn: {}", proposalId);
        return ProposalMapper.toResponse(proposal);
    }

    public List<ProposalResponse> listByRequest(Long requestId, Long userId, boolean isAdmin) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_REQUEST_NOT_FOUND));

        // Admin sees all proposals (e.g. when reviewing a dispute)
        if (isAdmin) {
            return proposalRepository.findByRequestId(requestId).stream()
                    .map(ProposalMapper::toResponse)
                    .toList();
        }

        // Client who owns the request sees all proposals
        if (request.getClient().getId().equals(userId)) {
            return proposalRepository.findByRequestId(requestId).stream()
                    .map(ProposalMapper::toResponse)
                    .toList();
        }

        // Provider sees only their own proposal
        ProviderProfile provider = providerProfileRepository.findByUserId(userId).orElse(null);
        if (provider != null) {
            return proposalRepository.findByRequestId(requestId).stream()
                    .filter(p -> p.getProvider().getId().equals(provider.getId()))
                    .map(ProposalMapper::toResponse)
                    .toList();
        }

        throw new ForbiddenException("Não tem permissão para ver as propostas deste pedido.");
    }

    public Page<ProposalResponse> listMyProposals(Long userId, Pageable pageable) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_PROVIDER_PROFILE_NOT_FOUND));

        return proposalRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId(), pageable)
                .map(ProposalMapper::toResponse);
    }

    private static String requestIdPayload(Long requestId) {
        return "{\"requestId\":" + requestId + "}";
    }
}
