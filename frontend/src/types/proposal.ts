export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type PricingModel = 'FIXED' | 'PER_UNIT' | 'RECURRING';

export interface ProposalResponse {
  id: number;
  requestId: number;
  providerId: number;
  providerName: string;
  providerRating: number;
  providerReviews: number;
  status: ProposalStatus;
  price: number;
  pricingModel: PricingModel;
  unitPrice: number | null;
  estimatedUnits: number | null;
  description: string;
  includesText: string | null;
  excludesText: string | null;
  estimatedDate: string | null;
  validUntil: string | null;
  createdAt: string;
}

export interface CreateProposalDto {
  price: number;
  pricingModel?: PricingModel;
  unitPrice?: number;
  estimatedUnits?: number;
  description: string;
  includesText?: string;
  excludesText?: string;
  estimatedDate?: string;
  validUntil?: string;
}
