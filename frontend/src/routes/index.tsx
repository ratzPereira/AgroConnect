import { lazy } from 'react';
import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/RootLayout';
import { SmartRedirect } from '@/components/SmartRedirect';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { RoleRoute } from '@/components/RoleRoute';
import { PageSuspense } from '@/components/PageSuspense';

// Auto-reload on stale chunk after deploy (dynamic import fails when hash changes)
function lazyWithReload<T extends ComponentType>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error: unknown) => {
      const alreadyReloaded = sessionStorage.getItem('chunk_reload');
      if (!alreadyReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        globalThis.location.reload();
      }
      throw error;
    })
  );
}

// Lazy-loaded pages (code-split into separate chunks)
const Dashboard = lazyWithReload(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Login = lazyWithReload(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazyWithReload(() => import('@/pages/Register').then(m => ({ default: m.Register })));
const Requests = lazyWithReload(() => import('@/pages/Requests').then(m => ({ default: m.Requests })));
const CreateRequest = lazyWithReload(() => import('@/pages/CreateRequest').then(m => ({ default: m.CreateRequest })));
const RequestDetail = lazyWithReload(() => import('@/pages/RequestDetail').then(m => ({ default: m.RequestDetail })));
const Transactions = lazyWithReload(() => import('@/pages/Transactions').then(m => ({ default: m.Transactions })));
const Notifications = lazyWithReload(() => import('@/pages/Notifications').then(m => ({ default: m.Notifications })));
const Profile = lazyWithReload(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const Landing = lazyWithReload(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const Terms = lazyWithReload(() => import('@/pages/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazyWithReload(() => import('@/pages/Privacy').then(m => ({ default: m.Privacy })));
const VerifyEmail = lazyWithReload(() => import('@/pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const ForgotPassword = lazyWithReload(() => import('@/pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazyWithReload(() => import('@/pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const ProviderOnboarding = lazyWithReload(() => import('@/pages/ProviderOnboarding').then(m => ({ default: m.ProviderOnboarding })));
const NotFound = lazyWithReload(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));

const Team = lazyWithReload(() => import('@/pages/provider/Team').then(m => ({ default: m.Team })));
const TeamMemberDetail = lazyWithReload(() => import('@/pages/provider/TeamMemberDetail').then(m => ({ default: m.TeamMemberDetail })));
const Machines = lazyWithReload(() => import('@/pages/provider/Machines').then(m => ({ default: m.Machines })));
const MachineDetail = lazyWithReload(() => import('@/pages/provider/MachineDetail').then(m => ({ default: m.MachineDetail })));
const Inventory = lazyWithReload(() => import('@/pages/provider/Inventory').then(m => ({ default: m.Inventory })));
const InventoryDetail = lazyWithReload(() => import('@/pages/provider/InventoryDetail').then(m => ({ default: m.InventoryDetail })));
const Finance = lazyWithReload(() => import('@/pages/provider/Finance').then(m => ({ default: m.Finance })));
const ProviderCalendar = lazyWithReload(() => import('@/pages/provider/Calendar').then(m => ({ default: m.ProviderCalendar })));
const StripePayments = lazyWithReload(() => import('@/pages/provider/StripePayments').then(m => ({ default: m.StripePayments })));
const StripeReturn = lazyWithReload(() => import('@/pages/provider/StripeReturn').then(m => ({ default: m.StripeReturn })));
const StripeRefresh = lazyWithReload(() => import('@/pages/provider/StripeRefresh').then(m => ({ default: m.StripeRefresh })));
const AdminDashboard = lazyWithReload(() => import('@/pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazyWithReload(() => import('@/pages/admin/Users').then(m => ({ default: m.AdminUsers })));
const Marketplace = lazyWithReload(() => import('@/pages/Marketplace').then(m => ({ default: m.Marketplace })));
const ListingDetail = lazyWithReload(() => import('@/pages/ListingDetail').then(m => ({ default: m.ListingDetail })));
const CreateListing = lazyWithReload(() => import('@/pages/CreateListing').then(m => ({ default: m.CreateListing })));
const MyListings = lazyWithReload(() => import('@/pages/MyListings').then(m => ({ default: m.MyListings })));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public pages
      {
        element: <PublicLayout />,
        children: [
          { path: '/landing', element: <PageSuspense><Landing /></PageSuspense> },
          { path: '/terms', element: <PageSuspense><Terms /></PageSuspense> },
          { path: '/privacy', element: <PageSuspense><Privacy /></PageSuspense> },
        ],
      },
      // Protected pages
      {
        element: <ProtectedRoute />,
        children: [
          // Onboarding (no sidebar, standalone page)
          { path: '/onboarding', element: <PageSuspense><ProviderOnboarding /></PageSuspense> },
          {
            element: <OnboardingGuard />,
            children: [
              {
                element: <MainLayout />,
                children: [
              { path: '/dashboard', element: <PageSuspense><Dashboard /></PageSuspense>, handle: { breadcrumb: 'Dashboard' } },
              { path: '/requests', element: <PageSuspense><Requests /></PageSuspense>, handle: { breadcrumb: 'Pedidos' } },
              { path: '/requests/new', element: <PageSuspense><CreateRequest /></PageSuspense>, handle: { breadcrumb: 'Novo Pedido' } },
              { path: '/requests/:id', element: <PageSuspense><RequestDetail /></PageSuspense>, handle: { breadcrumb: 'Detalhes' } },
              { path: '/transactions', element: <PageSuspense><Transactions /></PageSuspense>, handle: { breadcrumb: 'Transações' } },
              { path: '/marketplace', element: <PageSuspense><Marketplace /></PageSuspense>, handle: { breadcrumb: 'Marketplace' } },
              { path: '/marketplace/new', element: <PageSuspense><CreateListing /></PageSuspense>, handle: { breadcrumb: 'Novo Anúncio' } },
              { path: '/marketplace/me', element: <PageSuspense><MyListings /></PageSuspense>, handle: { breadcrumb: 'Os Meus Anúncios' } },
              { path: '/marketplace/:id', element: <PageSuspense><ListingDetail /></PageSuspense>, handle: { breadcrumb: 'Detalhes' } },
              { path: '/notifications', element: <PageSuspense><Notifications /></PageSuspense>, handle: { breadcrumb: 'Notificações' } },
              { path: '/profile', element: <PageSuspense><Profile /></PageSuspense>, handle: { breadcrumb: 'Perfil' } },
              {
                element: <RoleRoute allowedRoles={['PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR']} />,
                children: [

                  { path: '/provider/team', element: <PageSuspense><Team /></PageSuspense>, handle: { breadcrumb: 'Equipa' } },
                  { path: '/provider/team/:id', element: <PageSuspense><TeamMemberDetail /></PageSuspense>, handle: { breadcrumb: 'Detalhes' } },
                  { path: '/provider/machines', element: <PageSuspense><Machines /></PageSuspense>, handle: { breadcrumb: 'Máquinas' } },
                  { path: '/provider/machines/:id', element: <PageSuspense><MachineDetail /></PageSuspense>, handle: { breadcrumb: 'Detalhes' } },
                  { path: '/provider/inventory', element: <PageSuspense><Inventory /></PageSuspense>, handle: { breadcrumb: 'Inventário' } },
                  { path: '/provider/inventory/:id', element: <PageSuspense><InventoryDetail /></PageSuspense>, handle: { breadcrumb: 'Detalhes' } },
                  { path: '/provider/finance', element: <PageSuspense><Finance /></PageSuspense>, handle: { breadcrumb: 'Finanças' } },
                  { path: '/provider/calendar', element: <PageSuspense><ProviderCalendar /></PageSuspense>, handle: { breadcrumb: 'Calendário' } },
                  { path: '/provider/payments', element: <PageSuspense><StripePayments /></PageSuspense>, handle: { breadcrumb: 'Pagamentos' } },
                  { path: '/provider/stripe/return', element: <PageSuspense><StripeReturn /></PageSuspense>, handle: { breadcrumb: 'Stripe' } },
                  { path: '/provider/stripe/refresh', element: <PageSuspense><StripeRefresh /></PageSuspense>, handle: { breadcrumb: 'Stripe' } },
                ],
              },
              {
                element: <RoleRoute allowedRoles={['ADMIN']} />,
                children: [
                  { path: '/admin/dashboard', element: <PageSuspense><AdminDashboard /></PageSuspense>, handle: { breadcrumb: 'Administração' } },
                  { path: '/admin/users', element: <PageSuspense><AdminUsers /></PageSuspense>, handle: { breadcrumb: 'Utilizadores' } },
                ],
              },
            ],
              },
            ],
          },
        ],
      },
      // Auth pages
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/login', element: <PageSuspense><Login /></PageSuspense> },
              { path: '/register', element: <PageSuspense><Register /></PageSuspense> },
            ],
          },
        ],
      },
      // Bare routes
      { path: '/', element: <SmartRedirect /> },
      { path: '/verify-email', element: <PageSuspense><VerifyEmail /></PageSuspense> },
      { path: '/forgot-password', element: <PageSuspense><ForgotPassword /></PageSuspense> },
      { path: '/reset-password', element: <PageSuspense><ResetPassword /></PageSuspense> },
      { path: '*', element: <PageSuspense><NotFound /></PageSuspense> },
    ],
  },
]);
