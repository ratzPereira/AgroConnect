import type { ServiceRequestSummary, ServiceRequestResponse, Page } from '@/types/request';
import type { ProposalResponse } from '@/types/proposal';
import type { Transaction } from '@/types/transaction';
import type { Notification } from '@/types/notification';

// ── Users ──

export const mockClientUser = {
  id: 2,
  name: 'Maria Santos',
  email: 'maria@test.pt',
  role: 'CLIENT' as const,
};

export const mockProviderUser = {
  id: 6,
  name: 'António Mendes',
  email: 'antonio@test.pt',
  role: 'PROVIDER_MANAGER' as const,
};

export const mockAdminUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@agroconnect.pt',
  role: 'ADMIN' as const,
};

export const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

// ── Categories ──

export const mockCategories = [
  { id: 1, name: 'Preparação de Solo' },
  { id: 2, name: 'Tratamentos Fitossanitários' },
  { id: 8, name: 'Jardinagem' },
];

// ── Requests ──

export const mockRequestSummary: ServiceRequestSummary = {
  id: 1,
  categoryName: 'Preparação de Solo',
  status: 'PUBLISHED',
  title: 'Lavoura de terreno para batata-doce',
  parish: 'Angra do Heroísmo',
  municipality: 'Angra do Heroísmo',
  island: 'Terceira',
  area: 2.5,
  areaUnit: 'ha',
  urgency: 'MEDIUM',
  proposalCount: 0,
  createdAt: '2026-03-01T10:00:00Z',
};

export const mockRequestSummaries: ServiceRequestSummary[] = [
  mockRequestSummary,
  {
    id: 2,
    categoryName: 'Limpeza de Terreno',
    status: 'WITH_PROPOSALS',
    title: 'Limpeza de terreno abandonado',
    parish: 'São Sebastião',
    municipality: 'Angra do Heroísmo',
    island: 'Terceira',
    area: 1.0,
    areaUnit: 'ha',
    urgency: 'LOW',
    proposalCount: 2,
    createdAt: '2026-03-05T14:00:00Z',
  },
  {
    id: 4,
    categoryName: 'Jardinagem',
    status: 'COMPLETED',
    title: 'Manutenção de jardim residencial',
    parish: 'Santa Luzia',
    municipality: 'Angra do Heroísmo',
    island: 'Terceira',
    area: 0.3,
    areaUnit: 'ha',
    urgency: 'LOW',
    proposalCount: 1,
    createdAt: '2026-02-10T09:00:00Z',
  },
];

export const mockRequestDetail: ServiceRequestResponse = {
  id: 1,
  clientId: 2,
  clientName: 'Maria Santos',
  categoryId: 1,
  categoryName: 'Preparação de Solo',
  status: 'PUBLISHED',
  title: 'Lavoura de terreno para batata-doce',
  description: 'Preciso de lavrar 2.5 hectares para plantação de batata-doce. Terreno é relativamente plano.',
  latitude: 38.6545,
  longitude: -27.2167,
  parish: 'Angra do Heroísmo',
  municipality: 'Angra do Heroísmo',
  island: 'Terceira',
  area: 2.5,
  areaUnit: 'ha',
  urgency: 'MEDIUM',
  preferredDateFrom: '2026-04-01',
  preferredDateTo: '2026-04-15',
  formData: null,
  expiresAt: '2026-04-01T00:00:00Z',
  photos: [],
  proposalCount: 0,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
};

export const mockRequestsPage: Page<ServiceRequestSummary> = {
  content: mockRequestSummaries,
  totalPages: 1,
  totalElements: 3,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

// ── Proposals ──

export const mockProposal: ProposalResponse = {
  id: 1,
  requestId: 2,
  providerId: 1,
  providerName: 'AgroServiços Terceira Lda',
  providerRating: 4.7,
  providerReviews: 23,
  status: 'PENDING',
  price: 320,
  pricingModel: 'FIXED',
  unitPrice: null,
  estimatedUnits: null,
  description: 'Limpeza completa do terreno incluindo remoção de arbustos e nivelamento.',
  includesText: 'Transporte de resíduos verdes',
  excludesText: 'Remoção de pedras grandes',
  estimatedDate: '2026-03-20',
  validUntil: '2026-03-25',
  createdAt: '2026-03-06T09:00:00Z',
};

export const mockProposals: ProposalResponse[] = [
  mockProposal,
  {
    ...mockProposal,
    id: 2,
    providerId: 2,
    providerName: 'Verde Açores',
    providerRating: 4.5,
    providerReviews: 15,
    price: 280,
    description: 'Limpeza com destroçador seguida de nivelamento.',
    createdAt: '2026-03-07T11:00:00Z',
  },
];

// ── Transactions ──

export const mockTransaction: Transaction = {
  id: 1,
  requestId: 4,
  proposalId: 4,
  amount: 75,
  commissionRate: 0.12,
  commissionAmount: 9,
  providerPayout: 66,
  status: 'RELEASED',
  heldAt: '2026-02-15T10:00:00Z',
  releasedAt: '2026-02-20T15:00:00Z',
  refundedAt: null,
  createdAt: '2026-02-15T10:00:00Z',
};

export const mockTransactions: Transaction[] = [
  mockTransaction,
  {
    ...mockTransaction,
    id: 2,
    requestId: 5,
    proposalId: 5,
    amount: 180,
    commissionAmount: 21.6,
    providerPayout: 158.4,
    createdAt: '2026-01-10T08:00:00Z',
  },
];

// ── Notifications ──

export const mockNotification: Notification = {
  id: 1,
  type: 'NEW_PROPOSAL',
  title: 'Nova proposta recebida',
  body: 'Recebeu uma proposta para o seu pedido de limpeza de terreno.',
  data: '{"requestId": 2, "proposalId": 1}',
  read: false,
  createdAt: '2026-03-06T09:00:00Z',
  link: '/requests/2',
};

export const mockNotifications: Notification[] = [
  mockNotification,
  {
    id: 2,
    type: 'EXECUTION_COMPLETED',
    title: 'Serviço concluído',
    body: 'O prestador marcou o serviço como concluído.',
    data: '{"requestId": 4}',
    read: true,
    createdAt: '2026-02-20T15:00:00Z',
    link: '/requests/4',
  },
];

// ── Reviews ──

export const mockReview = {
  id: 1,
  requestId: 5,
  authorId: 5,
  authorName: 'Ana Ferreira',
  targetId: 7,
  targetName: 'Verde Açores',
  rating: 5,
  comment: 'Excelente trabalho! O solo ficou perfeitamente preparado.',
  createdAt: '2026-01-15T10:00:00Z',
};

// ── Finance ──

export const mockFinanceSummary = {
  totalRevenue: 2450,
  totalCommissions: 294,
  totalEarnings: 2156,
  pendingPayouts: 210,
  thisMonthEarnings: 450,
  completedJobs: 12,
  avgJobValue: 204.17,
};

// ── Admin ──

export const mockAdminDashboard = {
  totalUsers: 10,
  totalClients: 4,
  totalProviders: 3,
  totalRequests: 8,
  activeRequests: 5,
  totalVolume: 465,
  totalCommissions: 55.8,
  pendingDisputes: 0,
  avgPlatformRating: 4.7,
};

export const mockAdminUsers = [
  { id: 2, name: 'Maria Santos', email: 'maria@test.pt', role: 'CLIENT', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 6, name: 'António Mendes', email: 'antonio@test.pt', role: 'PROVIDER_MANAGER', active: true, createdAt: '2026-01-01T00:00:00Z' },
];
