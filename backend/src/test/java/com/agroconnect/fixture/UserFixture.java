package com.agroconnect.fixture;

import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.RefreshToken;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;

import java.time.Instant;

public final class UserFixture {

    private UserFixture() {}

    public static User.UserBuilder aClientUser() {
        return User.builder()
                .id(1L)
                .email("joao.silva@email.pt")
                .passwordHash("$2a$12$hashedpassword")
                .role(Role.CLIENT)
                .emailVerified(false)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }

    public static User.UserBuilder aProviderUser() {
        return User.builder()
                .id(2L)
                .email("provider@email.pt")
                .passwordHash("$2a$12$hashedpassword")
                .role(Role.PROVIDER_MANAGER)
                .emailVerified(false)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }

    public static ClientProfile.ClientProfileBuilder aClientProfile() {
        return ClientProfile.builder()
                .id(1L)
                .name("João Silva")
                .phone("+351912345678")
                .parish("Angra do Heroísmo")
                .municipality("Angra do Heroísmo")
                .island("Terceira");
    }

    public static ProviderProfile.ProviderProfileBuilder aProviderProfile() {
        return ProviderProfile.builder()
                .id(1L)
                .companyName("AgroServiços Terceira")
                .nif("123456789")
                .phone("+351912000000")
                .serviceRadiusKm(25)
                .avgRating(0)
                .totalReviews(0)
                .verified(false);
    }

    public static RefreshToken.RefreshTokenBuilder aRefreshToken() {
        return RefreshToken.builder()
                .id(1L)
                .tokenHash("abc123hash")
                .expiresAt(Instant.now().plusMillis(604800000))
                .revoked(false)
                .createdAt(Instant.now());
    }
}
