package com.agroconnect.unit.service;

import com.agroconnect.event.DisputeOpenedEvent;
import com.agroconnect.event.DisputeResolvedEvent;
import com.agroconnect.event.PaymentReleasedEvent;
import com.agroconnect.event.ProposalAcceptedEvent;
import com.agroconnect.event.ProposalReceivedEvent;
import com.agroconnect.event.RatingReceivedEvent;
import com.agroconnect.event.RequestExpiredEvent;
import com.agroconnect.event.WorkMarkedCompleteEvent;
import com.agroconnect.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class EmailServiceEventMethodsTest {

    private static final String RESEND_URL = "https://api.resend.com/emails";

    private EmailService service;
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        restTemplate = mock(RestTemplate.class);
        service = new EmailService(
                engine,
                restTemplate,
                "noreply@agroconnect.pt",
                "https://agroconnect.pt",
                "fake-key",
                "https://api.resend.com"
        );
    }

    @Test
    void sendProposalReceivedEmail_shouldRenderTemplateAndPostToResend() {
        ProposalReceivedEvent event = new ProposalReceivedEvent(
                1L, 2L, 3L,
                "antonio.cliente@agroconnect.pt",
                "António Silva",
                "Maria Lavoura Serviços",
                "Lavoura de 2 hectares",
                Instant.now()
        );

        service.sendProposalReceivedEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendProposalAcceptedEmail_shouldRenderTemplateAndPostToResend() {
        ProposalAcceptedEvent event = new ProposalAcceptedEvent(
                10L, 20L, 30L,
                "maria.provider@agroconnect.pt",
                "Maria Lavoura",
                "António Silva",
                "Lavoura de 2 hectares",
                new BigDecimal("250.00"),
                Instant.now()
        );

        service.sendProposalAcceptedEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendWorkMarkedCompleteEmail_shouldRenderTemplateAndPostToResend() {
        WorkMarkedCompleteEvent event = new WorkMarkedCompleteEvent(
                42L, 7L,
                "joao.cliente@agroconnect.pt",
                "João Pereira",
                "Maria Lavoura",
                Instant.now()
        );

        service.sendWorkMarkedCompleteEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendPaymentReleasedEmail_shouldRenderTemplateAndPostToResend() {
        PaymentReleasedEvent event = new PaymentReleasedEvent(
                99L, 42L, 30L,
                "maria.provider@agroconnect.pt",
                "Maria Lavoura",
                new BigDecimal("237.50"),
                Instant.now()
        );

        service.sendPaymentReleasedEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendRatingReceivedEmail_shouldRenderTemplateAndPostToResend() {
        RatingReceivedEvent event = new RatingReceivedEvent(
                501L, 3L, 30L,
                "maria.provider@agroconnect.pt",
                "Maria Lavoura",
                "António Silva",
                4,
                "Trabalho bem feito e dentro do prazo.",
                Instant.now()
        );

        service.sendRatingReceivedEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendDisputeOpenedEmail_shouldRenderTemplateAndPostToResend() {
        DisputeOpenedEvent event = new DisputeOpenedEvent(
                88L, 42L, 30L,
                "maria.provider@agroconnect.pt",
                "Maria Lavoura",
                "António Silva",
                "Servico nao foi concluido conforme combinado.",
                Instant.now()
        );

        service.sendDisputeOpenedEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendDisputeResolvedEmail_shouldRenderTemplateAndPostToResend() {
        DisputeResolvedEvent event = new DisputeResolvedEvent(
                88L, 42L, 3L,
                "antonio.cliente@agroconnect.pt",
                "António Silva",
                "Reembolso parcial de 50%.",
                Instant.now()
        );

        service.sendDisputeResolvedEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendRequestExpiredEmail_shouldRenderTemplateAndPostToResend() {
        RequestExpiredEvent event = new RequestExpiredEvent(
                123L, 3L,
                "antonio.cliente@agroconnect.pt",
                "António Silva",
                "Pulverização de citrinos",
                Instant.now().minusSeconds(86400),
                Instant.now()
        );

        service.sendRequestExpiredEmail(event);

        verify(restTemplate).postForEntity(eq(RESEND_URL), any(HttpEntity.class), eq(String.class));
    }
}
