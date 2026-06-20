package com.agroconnect.service;

import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserDisplayNameResolver {

    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public String resolve(User user) {
        if (user == null) {
            return "Utilizador";
        }
        return clientProfileRepository.findByUserId(user.getId())
                .map(ClientProfile::getName)
                .or(() -> providerProfileRepository.findByUserId(user.getId())
                        .map(ProviderProfile::getCompanyName))
                .orElseGet(() -> emailUsername(user.getEmail()));
    }

    private static String emailUsername(String email) {
        if (email == null || email.isBlank()) {
            return "Utilizador";
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }
}
