import { lazy } from 'react';
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

// Lazy-loaded pages (code-split into separate chunks)
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })));
const Requests = lazy(() => import('@/pages/Requests').then(m => ({ default: m.Requests })));
const CreateRequest = lazy(() => import('@/pages/CreateRequest').then(m => ({ default: m.CreateRequest })));
const RequestDetail = lazy(() => import('@/pages/RequestDetail').then(m => ({ default: m.RequestDetail })));
const Transactions = lazy(() => import('@/pages/Transactions').then(m => ({ default: m.Transactions })));
const Notifications = lazy(() => import('@/pages/Notifications').then(m => ({ default: m.Notifications })));
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const Terms = lazy(() => import('@/pages/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('@/pages/Privacy').then(m => ({ default: m.Privacy })));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const ProviderOnboarding = lazy(() => import('@/pages/ProviderOnboarding').then(m => ({ default: m.ProviderOnboarding })));
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));

const Team = lazy(() => import('@/pages/provider/Team').then(m => ({ default: m.Team })));
const Machines = lazy(() => import('@/pages/provider/Machines').then(m => ({ default: m.Machines })));
const Inventory = lazy(() => import('@/pages/provider/Inventory').then(m => ({ default: m.Inventory })));
const Finance = lazy(() => import('@/pages/provider/Finance').then(m => ({ default: m.Finance })));
const ProviderCalendar = lazy(() => import('@/pages/provider/Calendar').then(m => ({ default: m.ProviderCalendar })));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/pages/admin/Users').then(m => ({ default: m.AdminUsers })));
const Marketplace = lazy(() => import('@/pages/Marketplace').then(m => ({ default: m.Marketplace })));
const ListingDetail = lazy(() => import('@/pages/ListingDetail').then(m => ({ default: m.ListingDetail })));
const CreateListing = lazy(() => import('@/pages/CreateListing').then(m => ({ default: m.CreateListing })));
const MyListings = lazy(() => import('@/pages/MyListings').then(m => ({ default: m.MyListings })));

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
                  { path: '/provider/machines', element: <PageSuspense><Machines /></PageSuspense>, handle: { breadcrumb: 'Máquinas' } },
                  { path: '/provider/inventory', element: <PageSuspense><Inventory /></PageSuspense>, handle: { breadcrumb: 'Inventário' } },
                  { path: '/provider/finance', element: <PageSuspense><Finance /></PageSuspense>, handle: { breadcrumb: 'Finanças' } },
                  { path: '/provider/calendar', element: <PageSuspense><ProviderCalendar /></PageSuspense>, handle: { breadcrumb: 'Calendário' } },
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
