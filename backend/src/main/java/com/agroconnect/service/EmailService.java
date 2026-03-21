package com.agroconnect.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final ITemplateEngine templateEngine;
    private final String fromAddress;
    private final String baseUrl;

    public EmailService(JavaMailSender mailSender, ITemplateEngine templateEngine,
                        @Value("${agroconnect.mail.from}") String fromAddress,
                        @Value("${agroconnect.mail.base-url}") String baseUrl) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.fromAddress = fromAddress;
        this.baseUrl = baseUrl;
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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (MessagingException | RuntimeException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
