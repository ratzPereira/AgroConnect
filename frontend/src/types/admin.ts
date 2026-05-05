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
