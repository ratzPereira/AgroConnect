package com.agroconnect.service;

import com.agroconnect.dto.response.StripeAccountStatusResponse;
import com.agroconnect.dto.response.StripeOnboardingResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.repository.ProviderProfileRepository;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StripeAccountService {

    private static final Logger log = LoggerFactory.getLogger(StripeAccountService.class);
    private static final String DEFAULT_COUNTRY = "PT";

    private final ProviderProfileRepository providerRepository;
    private final StripeService stripeService;

    @Transactional
    public StripeOnboardingResponse startOnboarding(Long userId) {
        ProviderProfile provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de provider não encontrado."));

        if (provider.getStripeAccountId() == null) {
            Account account = stripeService.createExpressAccount(
                    provider.getId(),
                    provider.getUser().getEmail(),
                    DEFAULT_COUNTRY
            );
            provider.setStripeAccountId(account.getId());
            providerRepository.save(provider);
            log.info("Provider {} now has Stripe account {}", provider.getId(), account.getId());
        }

        AccountLink link = stripeService.createOnboardingLink(provider.getStripeAccountId());
        return new StripeOnboardingResponse(
                provider.getStripeAccountId(),
                link.getUrl(),
                link.getExpiresAt()
        );
    }

    public StripeAccountStatusResponse getStatus(Long userId) {
        ProviderProfile provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de provider não encontrado."));

        if (provider.getStripeAccountId() == null) {
            return StripeAccountStatusResponse.notConnected();
        }

        return StripeAccountStatusResponse.of(
                provider.getStripeAccountId(),
                provider.isStripeDetailsSubmitted(),
                provider.isStripeChargesEnabled(),
                provider.isStripePayoutsEnabled()
        );
    }

    /**
     * Pulls the latest capabilities from Stripe and persists them on the provider
     * profile. Used by both the manual /status endpoint (after the user returns
     * from Stripe-hosted onboarding) and the account.updated webhook handler.
     */
    @Transactional
    public StripeAccountStatusResponse syncFromStripe(Long userId) {
        ProviderProfile provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de provider não encontrado."));

        if (provider.getStripeAccountId() == null) {
            return StripeAccountStatusResponse.notConnected();
        }

        Account account = stripeService.retrieveAccount(provider.getStripeAccountId());
        applyCapabilities(provider, account);
        providerRepository.save(provider);

        return StripeAccountStatusResponse.of(
                provider.getStripeAccountId(),
                provider.isStripeDetailsSubmitted(),
                provider.isStripeChargesEnabled(),
                provider.isStripePayoutsEnabled()
        );
    }

    @Transactional
    public void applyAccountUpdated(Account account) {
        providerRepository.findByStripeAccountId(account.getId()).ifPresentOrElse(
                provider -> {
                    applyCapabilities(provider, account);
                    providerRepository.save(provider);
                    log.info("Synced Stripe account {} for provider {}: charges={}, payouts={}, detailsSubmitted={}",
                            account.getId(), provider.getId(),
                            provider.isStripeChargesEnabled(),
                            provider.isStripePayoutsEnabled(),
                            provider.isStripeDetailsSubmitted());
                },
                () -> log.warn("Received account.updated for unknown Stripe account {}", account.getId())
        );
    }

    private static void applyCapabilities(ProviderProfile provider, Account account) {
        provider.setStripeChargesEnabled(Boolean.TRUE.equals(account.getChargesEnabled()));
        provider.setStripePayoutsEnabled(Boolean.TRUE.equals(account.getPayoutsEnabled()));
        provider.setStripeDetailsSubmitted(Boolean.TRUE.equals(account.getDetailsSubmitted()));
    }
}
