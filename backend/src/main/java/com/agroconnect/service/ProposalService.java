package com.agroconnect.service;

import com.agroconnect.dto.request.CreateProposalDto;
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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProposalService {

    private static final Logger log = LoggerFactory.getLogger(ProposalService.class);

    private static final Set<RequestStatus> ACCEPTING_PROPOSALS = EnumSet.of(
            RequestStatus.PUBLISHED, RequestStatus.WITH_PROPOSALS);

    private final ProposalRepository proposalRepository;
    private final ServiceRequestRepository requestRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    @Value("${agroconnect.commission.rate}")
    private BigDecimal commissionRate;

    @Transactional
    public ProposalResponse create(Long requestId, CreateProposalDto dto, Long userId) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de serviço não encontrado."));

        if (!ACCEPTING_PROPOSALS.contains(request.getStatus())) {
            throw new InvalidStateException("Este pedido não está a aceitar propostas.");
        }

        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));

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
                "Recebeu uma nova proposta de " + provider.getCompanyName() + " para o pedido \"" + request.getTitle() + "\"."
        );

        log.info("Proposal created: {} for request {} by provider {}", proposal.getId(), requestId, provider.getId());
        return ProposalMapper.toResponse(proposal);
    }

    @Transactional
    public ProposalResponse accept(Long proposalId, Long userId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposta não encontrada."));

        ServiceRequest request = proposal.getRequest();

        if (!request.getClient().getId().equals(userId)) {
            throw new ForbiddenException("Não tem permissão para aceitar esta proposta.");
        }

        if (request.getStatus() != RequestStatus.WITH_PROPOSALS) {
            throw new InvalidStateException("O pedido não está no estado correto para aceitar propostas.");
        }

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new InvalidStateException("Só é possível aceitar propostas pendentes.");
        }

        // Accept proposal
        proposal.setStatus(ProposalStatus.ACCEPTED);
        proposalRepository.save(proposal);

        // Reject all other pending proposals
        proposalRepository.rejectAllPendingExcept(request.getId(), proposalId);

        // Transition request to AWARDED
        request.setStatus(RequestStatus.AWARDED);
        requestRepository.save(request);

        // Create transaction (escrow)
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
                .status(TransactionStatus.HELD)
                .heldAt(Instant.now())
                .build();

        transactionRepository.save(transaction);

        // Notify accepted provider
        notificationService.create(
                proposal.getProvider().getUser().getId(),
                "PROPOSAL_ACCEPTED",
                "Proposta aceite",
                "A sua proposta para o pedido \"" + request.getTitle() + "\" foi aceite!"
        );

        // Notify rejected providers
        List<Proposal> rejected = proposalRepository.findByRequestId(request.getId()).stream()
                .filter(p -> p.getStatus() == ProposalStatus.REJECTED)
                .toList();
        for (Proposal r : rejected) {
            notificationService.create(
                    r.getProvider().getUser().getId(),
                    "PROPOSAL_REJECTED",
                    "Proposta não selecionada",
                    "A sua proposta para o pedido \"" + request.getTitle() + "\" não foi selecionada."
            );
        }

        log.info("Proposal accepted: {} for request {}. Transaction created.", proposalId, request.getId());
        return ProposalMapper.toResponse(proposal);
    }

    @Transactional
    public ProposalResponse withdraw(Long proposalId, Long userId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposta não encontrada."));

        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));

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

    public List<ProposalResponse> listByRequest(Long requestId, Long userId) {
        requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de serviço não encontrado."));

        return proposalRepository.findByRequestId(requestId).stream()
                .map(ProposalMapper::toResponse)
                .toList();
    }

    public Page<ProposalResponse> listMyProposals(Long userId, Pageable pageable) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));

        return proposalRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId(), pageable)
                .map(ProposalMapper::toResponse);
    }
}
