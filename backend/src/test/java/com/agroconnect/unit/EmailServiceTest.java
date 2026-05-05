package com.agroconnect.unit;

import com.agroconnect.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.IContext;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private ITemplateEngine templateEngine;
    @Mock
    private RestTemplate restTemplate;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(templateEngine, restTemplate, "noreply@agroconnect.pt", "http://localhost:8000", "re_test_key");
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendVerificationEmail_givenValidData_shouldCallResendApi() {
        when(templateEngine.process(eq("email-verification"), any(IContext.class)))
                .thenReturn("<html>verify</html>");

        assertDoesNotThrow(() -> emailService.sendVerificationEmail("test@example.pt", "Test User", "token123"));

        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("https://api.resend.com/emails"), captor.capture(), eq(String.class));
        assertEquals("Bearer re_test_key", captor.getValue().getHeaders().getFirst("Authorization"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendPasswordResetEmail_givenValidData_shouldCallResendApi() {
        when(templateEngine.process(eq("password-reset"), any(IContext.class)))
                .thenReturn("<html>reset</html>");

        assertDoesNotThrow(() -> emailService.sendPasswordResetEmail("test@example.pt", "Test User", "token456"));

        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("https://api.resend.com/emails"), captor.capture(), eq(String.class));
    }

    @Test
    void sendVerificationEmail_givenApiError_shouldNotThrow() {
        when(templateEngine.process(anyString(), any(IContext.class)))
                .thenReturn("<html>test</html>");
        doThrow(new RestClientException("API error")).when(restTemplate)
                .postForEntity(anyString(), any(HttpEntity.class), eq(String.class));

        assertDoesNotThrow(() -> emailService.sendVerificationEmail("test@example.pt", "Test", "token"));
    }
}
