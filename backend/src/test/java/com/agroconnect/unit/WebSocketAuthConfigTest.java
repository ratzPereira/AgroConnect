package com.agroconnect.unit;

import com.agroconnect.config.WebSocketAuthConfig;
import com.agroconnect.security.JwtService;
import com.agroconnect.security.UserPrincipalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthConfigTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserPrincipalService userPrincipalService;

    @Mock
    private ChannelRegistration registration;

    private WebSocketAuthConfig config;
    private ChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        config = new WebSocketAuthConfig(jwtService, userPrincipalService);
        config.configureClientInboundChannel(registration);

        ArgumentCaptor<ChannelInterceptor> captor = ArgumentCaptor.forClass(ChannelInterceptor.class);
        verify(registration).interceptors(captor.capture());
        interceptor = captor.getValue();
    }

    private Message<byte[]> connectMessage(String authHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        if (authHeader != null) {
            accessor.addNativeHeader("Authorization", authHeader);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private UserDetails buildUserDetails(String email) {
        return new User(email, "password", List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
    }

    @Nested
    @DisplayName("preSend")
    class PreSend {

        @Test
        void preSend_validBearerToken_attachesAuthenticatedUser() {
            String email = "user@agroconnect.pt";
            UserDetails details = buildUserDetails(email);
            when(jwtService.isTokenValid("valid-token")).thenReturn(true);
            when(jwtService.extractEmail("valid-token")).thenReturn(email);
            when(userPrincipalService.loadUserByUsername(email)).thenReturn(details);

            Message<byte[]> message = connectMessage("Bearer valid-token");
            MessageChannel channel = mockChannel();

            Message<?> result = interceptor.preSend(message, channel);
            assertSame(message, result, "Message should be returned unchanged");

            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
            assertNotNull(accessor.getUser());
            UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) accessor.getUser();
            assertSame(details, auth.getPrincipal());
        }

        @Test
        void preSend_tokenWithoutBearerPrefix_stillProcessed() {
            String email = "raw@agroconnect.pt";
            UserDetails details = buildUserDetails(email);
            when(jwtService.isTokenValid("raw-token")).thenReturn(true);
            when(jwtService.extractEmail("raw-token")).thenReturn(email);
            when(userPrincipalService.loadUserByUsername(email)).thenReturn(details);

            Message<byte[]> message = connectMessage("raw-token");
            interceptor.preSend(message, mockChannel());

            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
            assertNotNull(accessor.getUser());
        }

        @Test
        void preSend_invalidToken_doesNotAttachUser() {
            when(jwtService.isTokenValid("invalid")).thenReturn(false);

            Message<byte[]> message = connectMessage("Bearer invalid");
            interceptor.preSend(message, mockChannel());

            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
            assertNull(accessor.getUser());
            verifyNoInteractions(userPrincipalService);
        }

        @Test
        void preSend_jwtServiceThrows_swallowsException() {
            when(jwtService.isTokenValid("bad")).thenThrow(new RuntimeException("boom"));

            Message<byte[]> message = connectMessage("Bearer bad");
            Message<?> result = interceptor.preSend(message, mockChannel());

            assertSame(message, result);
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
            assertNull(accessor.getUser());
        }

        @Test
        void preSend_noAuthorizationHeader_skipsAuth() {
            Message<byte[]> message = connectMessage(null);
            interceptor.preSend(message, mockChannel());

            verifyNoInteractions(jwtService);
            verifyNoInteractions(userPrincipalService);
        }

        @Test
        void preSend_emptyAuthorizationHeader_skipsAuth() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setLeaveMutable(true);
            accessor.setNativeHeader("Authorization", null);
            Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            interceptor.preSend(message, mockChannel());

            verifyNoInteractions(jwtService);
            verifyNoInteractions(userPrincipalService);
        }

        @Test
        void preSend_nonConnectCommand_skipsAuth() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
            accessor.setLeaveMutable(true);
            accessor.addNativeHeader("Authorization", "Bearer something");
            Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            interceptor.preSend(message, mockChannel());

            verifyNoInteractions(jwtService);
            verifyNoInteractions(userPrincipalService);
        }
    }

    private MessageChannel mockChannel() {
        return new MessageChannel() {
            @Override
            public boolean send(Message<?> message) {
                return true;
            }

            @Override
            public boolean send(Message<?> message, long timeout) {
                return true;
            }
        };
    }

    @Test
    void configureClientInboundChannel_registersInterceptor() {
        verify(registration).interceptors(any(ChannelInterceptor.class));
    }
}
