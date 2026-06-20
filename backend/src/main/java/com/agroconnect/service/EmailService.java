package com.agroconnect.service;

import com.agroconnect.event.DisputeOpenedEvent;
import com.agroconnect.event.DisputeResolvedEvent;
import com.agroconnect.event.PaymentReleasedEvent;
import com.agroconnect.event.ProposalAcceptedEvent;
import com.agroconnect.event.ProposalReceivedEvent;
import com.agroconnect.event.RatingReceivedEvent;
import com.agroconnect.event.RequestExpiredEvent;
import com.agroconnect.event.WorkMarkedCompleteEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ITemplateEngine templateEngine;
    private final RestTemplate restTemplate;
    private final String fromAddress;
    private final String baseUrl;
    private final String resendApiKey;
    private final String resendBaseUrl;

    public EmailService(ITemplateEngine templateEngine,
                        RestTemplate restTemplate,
                        @Value("${agroconnect.mail.from}") String fromAddress,
                        @Value("${agroconnect.mail.base-url}") String baseUrl,
                        @Value("${spring.mail.password:}") String resendApiKey,
                        @Value("${agroconnect.email.resend.base-url:https://api.resend.com}") String resendBaseUrl) {
        this.templateEngine = templateEngine;
        this.restTemplate = restTemplate;
        this.fromAddress = fromAddress;
        this.baseUrl = baseUrl;
        this.resendApiKey = resendApiKey;
        this.resendBaseUrl = resendBaseUrl;
    }

    public void sendVerificationEmail(String to, String name, String token) {
        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("link", baseUrl + "/verify-email?token=" + token);
        context.setVariable("expiryHours", "24");

        String html = templateEngine.process("email-verification", context);
        sendHtmlEmail(to, "Verifique o seu email — AgroConnect", html);
    }

    public void sendPasswordResetEmail(String to, String name, String token) {
        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("link", baseUrl + "/reset-password?token=" + token);
        context.setVariable("expiryMinutes", "60");

        String html = templateEngine.process("password-reset", context);
        sendHtmlEmail(to, "Redefinir palavra-passe — AgroConnect", html);
    }

    public void sendProposalReceivedEmail(ProposalReceivedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("clientName", event.clientName());
        ctx.setVariable("requestTitle", event.requestTitle());
        ctx.setVariable("providerName", event.providerDisplayName());
        ctx.setVariable("requestId", event.requestId());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/proposal-received", ctx);
        sendHtmlEmail(event.clientEmail(), "Nova proposta no teu pedido — AgroConnect", html);
    }

    public void sendProposalAcceptedEmail(ProposalAcceptedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("providerName", event.providerName());
        ctx.setVariable("requestTitle", event.requestTitle());
        ctx.setVariable("acceptedPrice", event.acceptedPrice());
        ctx.setVariable("clientName", event.clientName());
        ctx.setVariable("requestId", event.requestId());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/proposal-accepted", ctx);
        sendHtmlEmail(event.providerEmail(), "A tua proposta foi aceite — AgroConnect", html);
    }

    public void sendWorkMarkedCompleteEmail(WorkMarkedCompleteEvent event) {
        Context ctx = new Context();
        ctx.setVariable("clientName", event.clientName());
        ctx.setVariable("providerName", event.providerName());
        ctx.setVariable("requestId", event.requestId());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/work-marked-complete", ctx);
        sendHtmlEmail(event.clientEmail(), "O prestador marcou o trabalho como concluído — AgroConnect", html);
    }

    public void sendPaymentReleasedEmail(PaymentReleasedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("providerName", event.providerName());
        ctx.setVariable("amount", event.amount());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/payment-released", ctx);
        sendHtmlEmail(event.providerEmail(), "Pagamento libertado — AgroConnect", html);
    }

    public void sendRatingReceivedEmail(RatingReceivedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("rateeName", event.rateeName());
        ctx.setVariable("raterName", event.raterName());
        ctx.setVariable("stars", event.stars());
        ctx.setVariable("comment", event.comment());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/rating-received", ctx);
        sendHtmlEmail(event.rateeEmail(), "Recebeste uma nova avaliação — AgroConnect", html);
    }

    public void sendDisputeOpenedEmail(DisputeOpenedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("recipientName", event.recipientName());
        ctx.setVariable("openedByName", event.openedByName());
        ctx.setVariable("reason", event.reason());
        ctx.setVariable("requestId", event.requestId());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/dispute-opened", ctx);
        sendHtmlEmail(event.recipientEmail(), "Disputa aberta — AgroConnect", html);
    }

    public void sendDisputeResolvedEmail(DisputeResolvedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("recipientName", event.recipientName());
        ctx.setVariable("resolution", event.resolution());
        ctx.setVariable("requestId", event.requestId());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/dispute-resolved", ctx);
        sendHtmlEmail(event.recipientEmail(), "Disputa resolvida — AgroConnect", html);
    }

    public void sendRequestExpiredEmail(RequestExpiredEvent event) {
        Context ctx = new Context();
        ctx.setVariable("clientName", event.clientName());
        ctx.setVariable("requestTitle", event.requestTitle());
        ctx.setVariable("baseUrl", baseUrl);
        String html = templateEngine.process("email/request-expired", ctx);
        sendHtmlEmail(event.clientEmail(), "O teu pedido expirou — AgroConnect", html);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = Map.of(
                    "from", fromAddress,
                    "to", List.of(to),
                    "subject", subject,
                    "html", htmlContent
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(resendBaseUrl + "/emails", request, String.class);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
