import { apiClient } from './client';
import type {
  StripeAccountStatusResponse,
  StripeOnboardingResponse,
} from '@/types/stripe';

export async function getStripeAccountStatus(refresh = false): Promise<StripeAccountStatusResponse> {
  const response = await apiClient.get<StripeAccountStatusResponse>('/stripe/account/status', {
    params: { refresh },
  });
  return response.data;
}

export async function startStripeOnboarding(): Promise<StripeOnboardingResponse> {
  const response = await apiClient.post<StripeOnboardingResponse>('/stripe/account/onboard');
  return response.data;
}

export async function refreshStripeOnboardingLink(): Promise<StripeOnboardingResponse> {
  const response = await apiClient.post<StripeOnboardingResponse>('/stripe/account/refresh-link');
  return response.data;
}
