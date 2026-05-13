export type StripeAccountStatus = 'NOT_CONNECTED' | 'PENDING' | 'ACTIVE';

export interface StripeAccountStatusResponse {
  accountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  status: StripeAccountStatus;
}

export interface StripeOnboardingResponse {
  accountId: string;
  onboardingUrl: string;
  expiresAt: number;
}

export interface ProposalAcceptResponse {
  transactionId: number;
  proposalId: number;
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  publishableKey: string;
}
