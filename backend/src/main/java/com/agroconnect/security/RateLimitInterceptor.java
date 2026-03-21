package com.agroconnect.security;

import com.agroconnect.config.RateLimitProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private final StringRedisTemplate redisTemplate;
    private final RateLimitProperties properties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RateLimit rateLimit = handlerMethod.getMethodAnnotation(RateLimit.class);
        int maxRequests = rateLimit != null ? rateLimit.requests() : properties.apiDefaultMax();
        int windowSeconds = rateLimit != null ? rateLimit.windowSeconds() : properties.apiDefaultWindowSeconds();

        String clientIdentifier = resolveClientIdentifier(request);
        String key = "rl:" + clientIdentifier + ":" + request.getMethod() + ":" + request.getRequestURI();

        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
        }

        if (count != null && count > maxRequests) {
            log.warn("Rate limit exceeded for key: {} (count={})", key, count);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(windowSeconds));
            new ObjectMapper().writeValue(response.getOutputStream(), Map.of(
                    "timestamp", Instant.now().toString(),
                    "status", 429,
                    "error", "Demasiadas tentativas",
                    "message", "Excedeu o limite de pedidos. Tente novamente em " + windowSeconds + " segundos.",
                    "path", request.getRequestURI()
            ));
            return false;
        }

        return true;
    }

    private String resolveClientIdentifier(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal principal) {
            return "user:" + principal.getId();
        }

        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}
