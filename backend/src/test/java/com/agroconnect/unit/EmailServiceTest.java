package com.agroconnect.unit;

import com.agroconnect.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.IContext;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;
    @Mock
    private ITemplateEngine templateEngine;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, templateEngine, "noreply@agroconnect.pt", "http://localhost:8000");
    }

    @Test
    void sendVerificationEmail_givenValidData_shouldSendEmail() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("email-verification"), any(IContext.class)))
                .thenReturn("<html>verify</html>");

        assertDoesNotThrow(() -> emailService.sendVerificationEmail("test@example.pt", "Test User", "token123"));
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendPasswordResetEmail_givenValidData_shouldSendEmail() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("password-reset"), any(IContext.class)))
                .thenReturn("<html>reset</html>");

        assertDoesNotThrow(() -> emailService.sendPasswordResetEmail("test@example.pt", "Test User", "token456"));
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendVerificationEmail_givenMailException_shouldNotThrow() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(anyString(), any(IContext.class)))
                .thenReturn("<html>test</html>");
        doThrow(new MailSendException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() -> emailService.sendVerificationEmail("test@example.pt", "Test", "token"));
    }
}
