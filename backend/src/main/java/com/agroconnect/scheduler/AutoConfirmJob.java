package com.agroconnect.scheduler;

import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AutoConfirmJob {

    private static final Logger log = LoggerFactory.getLogger(AutoConfirmJob.class);
    private static final int AUTO_CONFIRM_HOURS = 48;

    private final ServiceExecutionRepository executionRepository;
    private final ServiceRequestRepository requestRepository;
    private final TransactionService transactionService;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void autoConfirmExpiredExecutions() {
        Instant cutoff = Instant.now().minus(AUTO_CONFIRM_HOURS, ChronoUnit.HOURS);
        List<ServiceExecution> executions = executionRepository.findCompletedAwaitingConfirmationBefore(cutoff);

        for (ServiceExecution execution : executions) {
            ServiceRequest request = execution.getProposal().getRequest();

            if (request.getStatus() != RequestStatus.AWAITING_CONFIRMATION) {
                continue;
            }

            request.setStatus(RequestStatus.COMPLETED);
            requestRepository.save(request);

            transactionService.release(request.getId());

            notificationService.create(
                    request.getClient().getId(),
                    "AUTO_CONFIRMED",
                    "Serviço confirmado automaticamente",
                    "O serviço \"" + request.getTitle() + "\" foi confirmado automaticamente após 48 horas sem resposta."
            );

            log.info("Auto-confirmed request {} after {}h without response", request.getId(), AUTO_CONFIRM_HOURS);
        }

        if (!executions.isEmpty()) {
            log.info("Auto-confirm job processed {} executions", executions.size());
        }
    }
}
