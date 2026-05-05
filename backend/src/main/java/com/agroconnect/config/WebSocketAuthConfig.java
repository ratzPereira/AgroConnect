package com.agroconnect.config;

import com.agroconnect.security.JwtService;
import com.agroconnect.security.UserPrincipalService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketAuthConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthConfig.class);

    private final JwtService jwtService;
    private final UserPrincipalService userPrincipalService;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                authenticateConnect(message);
                return message;
            }
        });
    }

    private void authenticateConnect(Message<?> message) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return;
        }
        String token = extractBearerToken(accessor);
        if (token == null) {
            return;
        }
        try {
            attachUser(accessor, token);
        } catch (Exception e) {
            log.warn("WebSocket auth failed: {}", e.getMessage());
        }
    }

    private String extractBearerToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            return null;
        }
        String token = authHeaders.get(0);
        return token.startsWith("Bearer ") ? token.substring(7) : token;
    }

    private void attachUser(StompHeaderAccessor accessor, String token) {
        if (!jwtService.isTokenValid(token)) {
            return;
        }
        String email = jwtService.extractEmail(token);
        UserDetails userDetails = userPrincipalService.loadUserByUsername(email);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        accessor.setUser(auth);
    }
}
