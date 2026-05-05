import { http, HttpResponse } from 'msw';
import {
  mockClientUser,
  mockTokens,
  mockRequestsPage,
  mockRequestDetail,
  mockProposals,
  mockTransactions,
  mockNotifications,
  mockFinanceSummary,
  mockAdminDashboard,
  mockAdminUsers,
  mockReview,
} from './data';

const BASE = '/api/v1';

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ ...mockTokens, user: mockClientUser }),
  ),
  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json({ message: 'Conta criada com sucesso. Verifique o seu email.' }),
  ),
  http.post(`${BASE}/auth/refresh`, () =>
    HttpResponse.json({ ...mockTokens, user: mockClientUser }),
  ),

  // Requests
  http.get(`${BASE}/requests/mine`, () =>
    HttpResponse.json(mockRequestsPage),
  ),
  http.get(`${BASE}/requests/available`, () =>
    HttpResponse.json(mockRequestsPage),
  ),
  http.post(`${BASE}/requests`, () =>
    HttpResponse.json(mockRequestDetail, { status: 201 }),
  ),
  http.get(`${BASE}/requests/:id`, () =>
    HttpResponse.json(mockRequestDetail),
  ),

  // Proposals
  http.get(`${BASE}/requests/:requestId/proposals`, () =>
    HttpResponse.json(mockProposals),
  ),
  http.post(`${BASE}/requests/:requestId/proposals`, () =>
    HttpResponse.json(mockProposals[0], { status: 201 }),
  ),
  http.get(`${BASE}/proposals/mine`, () =>
    HttpResponse.json({ content: mockProposals, totalPages: 1, totalElements: 2, number: 0, size: 20, first: true, last: true }),
  ),

  // Transactions
  http.get(`${BASE}/transactions/me`, () =>
    HttpResponse.json({ content: mockTransactions, totalPages: 1, totalElements: 2, number: 0, size: 20, first: true, last: true }),
  ),

  // Notifications
  http.get(`${BASE}/notifications/me`, () =>
    HttpResponse.json({ content: mockNotifications, totalPages: 1, totalElements: 2, number: 0, size: 20, first: true, last: true }),
  ),
  http.get(`${BASE}/notifications/unread-count`, () =>
    HttpResponse.json({ count: 3 }),
  ),
  http.post(`${BASE}/notifications/mark-read`, () =>
    HttpResponse.json(null, { status: 204 }),
  ),

  // Profile
  http.get(`${BASE}/profile/me`, () =>
    HttpResponse.json({ ...mockClientUser, phone: '912345678', parish: 'Angra do Heroísmo' }),
  ),

  // Reviews
  http.get(`${BASE}/requests/:requestId/reviews`, () =>
    HttpResponse.json([mockReview]),
  ),

  // Provider backoffice
  http.get(`${BASE}/providers/me/team`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${BASE}/providers/me/machines`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${BASE}/providers/me/inventory`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${BASE}/providers/me/inventory/low-stock`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${BASE}/providers/me/finance/summary`, () =>
    HttpResponse.json(mockFinanceSummary),
  ),

  // Admin
  http.get(`${BASE}/admin/dashboard`, () =>
    HttpResponse.json(mockAdminDashboard),
  ),
  http.get(`${BASE}/admin/users`, () =>
    HttpResponse.json({ content: mockAdminUsers, totalPages: 1, totalElements: 2, number: 0, size: 20, first: true, last: true }),
  ),
];
