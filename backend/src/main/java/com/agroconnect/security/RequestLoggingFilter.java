package com.agroconnect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    private static final Set<String> EXCLUDED_PREFIXES = Set.of(
            "/actuator", "/swagger-ui", "/v3/api-docs"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (isExcluded(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().substring(0, 8);
        }

        String clientIp = resolveClientIp(request);
        String method = request.getMethod();

        MDC.put("requestId", requestId);
        MDC.put("clientIp", clientIp);
        MDC.put("method", method);
        MDC.put("uri", uri);

        long start = System.currentTimeMillis();

        try {
            response.setHeader("X-Request-Id", requestId);
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - start;

            String userId = "-";
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal principal) {
                userId = String.valueOf(principal.getId());
            }

            log.info("[{}] {} {} -> {} ({}ms) user={}", requestId, method, uri,
                    response.getStatus(), duration, userId);

            MDC.clear();
        }
    }

    private boolean isExcluded(String uri) {
        for (String prefix : EXCLUDED_PREFIXES) {
            if (uri.startsWith(prefix)) return true;
        }
        return false;
    }

    private String resolveClientIp(HttpServletRequest request) {
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
