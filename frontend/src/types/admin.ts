import type { Role } from './auth';

export interface AdminDashboard {
  totalUsers: number;
  totalClients: number;
  totalProviders: number;
  totalRequests: number;
  activeRequests: number;
  totalVolume: number;
  totalCommissions: number;
  pendingDisputes: number;
  avgPlatformRating: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  requestCount: number;
  proposalCount: number;
}

export interface AdminDispute {
  requestId: number;
  clientName: string;
  providerName: string;
  requestTitle: string;
  amount: number;
  createdAt: string;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface DayRevenue {
  date: string;
  amount: number;
  commission: number;
}

export interface AdminAnalytics {
  usersByRole: LabelCount[];
  requestsByStatus: LabelCount[];
  registrationsDaily: DayCount[];
  requestsDaily: DayCount[];
  revenueDaily: DayRevenue[];
}

export type DisputeResolution = 'RELEASE' | 'REFUND';
