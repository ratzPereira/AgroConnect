package com.agroconnect.unit;

import com.agroconnect.exception.DuplicateEmailException;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.GlobalExceptionHandler;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.TooManyAttemptsException;
import com.agroconnect.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest("GET", "/api/v1/requests/99");
    }

    @Test
    void handleNotFound_shouldReturn404WithMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("ServiceRequest", 99L);

        ResponseEntity<ErrorResponse> response = handler.handleNotFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(404, body.status());
        assertEquals("Recurso não encontrado", body.error());
        assertEquals("ServiceRequest não encontrado(a) com id: 99", body.message());
        assertEquals("/api/v1/requests/99", body.path());
        assertNotNull(body.timestamp());
    }

    @Test
    void handleInvalidState_shouldReturn409WithMessage() {
        InvalidStateException ex = new InvalidStateException("Não é possível cancelar um pedido já concluído");

        ResponseEntity<ErrorResponse> response = handler.handleInvalidState(ex, request);

        assertEquals(HttpStatus.CONFLICT.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(409, body.status());
        assertEquals("Operação inválida", body.error());
        assertEquals("Não é possível cancelar um pedido já concluído", body.message());
    }

    @Test
    void handleForbidden_shouldReturn403WithMessage() {
        ForbiddenException ex = new ForbiddenException("Não tem permissão para aceder a este recurso");

        ResponseEntity<ErrorResponse> response = handler.handleForbidden(ex, request);

        assertEquals(HttpStatus.FORBIDDEN.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(403, body.status());
        assertEquals("Acesso negado", body.error());
        assertEquals("Não tem permissão para aceder a este recurso", body.message());
    }

    @Test
    void handleValidation_shouldReturn400WithMessage() {
        ValidationException ex = new ValidationException("O campo 'area' é obrigatório");

        ResponseEntity<ErrorResponse> response = handler.handleValidation(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.status());
        assertEquals("Erro de validação", body.error());
        assertEquals("O campo 'area' é obrigatório", body.message());
    }

    @Test
    void handleDuplicateEmail_shouldReturn409WithEmail() {
        DuplicateEmailException ex = new DuplicateEmailException("joao@exemplo.pt");

        ResponseEntity<ErrorResponse> response = handler.handleDuplicateEmail(ex, request);

        assertEquals(HttpStatus.CONFLICT.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(409, body.status());
        assertEquals("Email duplicado", body.error());
        assertEquals("Já existe uma conta registada com o email: joao@exemplo.pt", body.message());
    }

    @Test
    void handleBadCredentials_shouldReturn401() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        ResponseEntity<ErrorResponse> response = handler.handleBadCredentials(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(401, body.status());
        assertEquals("Credenciais inválidas", body.error());
        assertEquals("Email ou palavra-passe incorretos.", body.message());
    }

    @Test
    void handleBeanValidation_shouldReturn400WithFieldErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult br = mock(BindingResult.class);
        when(ex.getBindingResult()).thenReturn(br);

        FieldError fe1 = new FieldError("createRequestDto", "description", "must not be blank");
        FieldError fe2 = new FieldError("createRequestDto", "area", "must be positive");
        when(br.getFieldErrors()).thenReturn(List.of(fe1, fe2));

        ResponseEntity<ErrorResponse> response = handler.handleBeanValidation(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.status());
        assertEquals("Erro de validação", body.error());
        assertEquals("must not be blank; must be positive", body.message());
    }

    @Test
    void handleAccessDenied_shouldReturn403() {
        AccessDeniedException ex = new AccessDeniedException("Access is denied");

        ResponseEntity<ErrorResponse> response = handler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(403, body.status());
        assertEquals("Acesso negado", body.error());
        assertEquals("Não tem permissão para aceder a este recurso.", body.message());
    }

    @Test
    void handleTooManyAttempts_shouldReturn429WithMessage() {
        TooManyAttemptsException ex = new TooManyAttemptsException("Demasiadas tentativas. Tente novamente em 60 segundos.");

        ResponseEntity<ErrorResponse> response = handler.handleTooManyAttempts(ex, request);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(429, body.status());
        assertEquals("Demasiadas tentativas", body.error());
        assertEquals("Demasiadas tentativas. Tente novamente em 60 segundos.", body.message());
    }

    @Test
    void handleGeneric_shouldReturn500() {
        Exception ex = new RuntimeException("Unexpected NPE");

        ResponseEntity<ErrorResponse> response = handler.handleGeneric(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), response.getStatusCode().value());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(500, body.status());
        assertEquals("Erro interno", body.error());
        assertEquals("Ocorreu um erro inesperado.", body.message());
        assertEquals("/api/v1/requests/99", body.path());
    }
}
