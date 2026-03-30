package com.agroconnect;

import com.agroconnect.config.JwtProperties;
import com.agroconnect.config.RateLimitProperties;
import com.agroconnect.config.SecurityProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, RateLimitProperties.class, SecurityProperties.class})
public class AgroConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgroConnectApplication.class, args);
    }
}
