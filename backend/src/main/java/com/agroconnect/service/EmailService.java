package com.agroconnect.service;

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

    public EmailService(ITemplateEngine templateEngine,
                        RestTemplate restTemplate,
                        @Value("${agroconnect.mail.from}") String fromAddress,
                        @Value("${agroconnect.mail.base-url}") String baseUrl,
                        @Value("${spring.mail.password:}") String resendApiKey) {
        this.templateEngine = templateEngine;
        this.restTemplate = restTemplate;
        this.fromAddress = fromAddress;
        this.baseUrl = baseUrl;
        this.resendApiKey = resendApiKey;
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
            restTemplate.postForEntity("https://api.resend.com/emails", request, String.class);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
