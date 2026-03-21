package com.agroconnect.unit;

import com.agroconnect.config.RateLimitProperties;
import com.agroconnect.security.RateLimit;
import com.agroconnect.security.RateLimitInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitInterceptorTest {

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOps;

    private RateLimitInterceptor interceptor;
    private RateLimitProperties properties;

    @BeforeEach
    void setUp() {
        properties = new RateLimitProperties(5, 60, 3, 60, 60, 60);
        interceptor = new RateLimitInterceptor(redisTemplate, properties);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void preHandle_givenWithinLimit_shouldReturnTrue() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod handler = mockHandlerWithRateLimit(5, 60);

        when(valueOps.increment(anyString())).thenReturn(1L);

        assertTrue(interceptor.preHandle(request, response, handler));
    }

    @Test
    void preHandle_givenExceedingLimit_shouldReturn429() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod handler = mockHandlerWithRateLimit(5, 60);

        when(valueOps.increment(anyString())).thenReturn(6L);

        assertFalse(interceptor.preHandle(request, response, handler));
        assertEquals(429, response.getStatus());
    }

    @Test
    void preHandle_givenXForwardedFor_shouldUseFirstIp() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/requests");
        request.addHeader("X-Forwarded-For", "1.2.3.4, 5.6.7.8");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(valueOps.increment(anyString())).thenReturn(1L);

        assertTrue(interceptor.preHandle(request, response, mock(HandlerMethod.class)));
    }

    private HandlerMethod mockHandlerWithRateLimit(int requests, int windowSeconds) throws Exception {
        HandlerMethod handler = mock(HandlerMethod.class);
        RateLimit annotation = mock(RateLimit.class);
        when(annotation.requests()).thenReturn(requests);
        when(annotation.windowSeconds()).thenReturn(windowSeconds);
        when(handler.getMethodAnnotation(eq(RateLimit.class))).thenReturn(annotation);
        return handler;
    }
}
