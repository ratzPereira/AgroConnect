package com.agroconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Permits unauthenticated access to the profile-guarded E2E test endpoints
 * (TestDataController). Active ONLY when the "e2e" profile is enabled, so
 * production deployments are unaffected. The endpoints themselves are also
 * @Profile("e2e"), so this chain is doubly guarded.
 */
@Configuration
@Profile("e2e")
public class E2ESecurityConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SecurityFilterChain e2eTestEndpointsFilterChain(HttpSecurity http) throws Exception {
        return http
                .securityMatcher("/v1/admin/test/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }
}
