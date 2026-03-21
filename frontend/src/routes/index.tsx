import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/RootLayout';
import { SmartRedirect } from '@/components/SmartRedirect';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { RoleRoute } from '@/components/RoleRoute';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Requests } from '@/pages/Requests';
import { CreateRequest } from '@/pages/CreateRequest';
import { RequestDetail } from '@/pages/RequestDetail';
import { Transactions } from '@/pages/Transactions';
import { Notifications } from '@/pages/Notifications';
import { Profile } from '@/pages/Profile';
import { Landing } from '@/pages/Landing';
import { Terms } from '@/pages/Terms';
import { Privacy } from '@/pages/Privacy';
import { ProviderDashboard } from '@/pages/provider/Dashboard';
import { Team } from '@/pages/provider/Team';
import { Machines } from '@/pages/provider/Machines';
import { Inventory } from '@/pages/provider/Inventory';
import { Finance } from '@/pages/provider/Finance';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminUsers } from '@/pages/admin/Users';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { NotFound } from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public pages
      {
        element: <PublicLayout />,
        children: [
          { path: '/landing', element: <Landing /> },
          { path: '/terms', element: <Terms /> },
          { path: '/privacy', element: <Privacy /> },
        ],
      },
      // Protected pages
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: '/dashboard', element: <Dashboard />, handle: { breadcrumb: 'Dashboard' } },
              { path: '/requests', element: <Requests />, handle: { breadcrumb: 'Pedidos' } },
              { path: '/requests/new', element: <CreateRequest />, handle: { breadcrumb: 'Novo Pedido' } },
              { path: '/requests/:id', element: <RequestDetail />, handle: { breadcrumb: 'Detalhes' } },
              { path: '/transactions', element: <Transactions />, handle: { breadcrumb: 'Transações' } },
              { path: '/notifications', element: <Notifications />, handle: { breadcrumb: 'Notificações' } },
              { path: '/profile', element: <Profile />, handle: { breadcrumb: 'Perfil' } },
              {
                element: <RoleRoute allowedRoles={['PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR']} />,
                children: [
                  { path: '/provider/dashboard', element: <ProviderDashboard />, handle: { breadcrumb: 'Backoffice' } },
                  { path: '/provider/team', element: <Team />, handle: { breadcrumb: 'Equipa' } },
                  { path: '/provider/machines', element: <Machines />, handle: { breadcrumb: 'Máquinas' } },
                  { path: '/provider/inventory', element: <Inventory />, handle: { breadcrumb: 'Inventário' } },
                  { path: '/provider/finance', element: <Finance />, handle: { breadcrumb: 'Finanças' } },
                ],
              },
              {
                element: <RoleRoute allowedRoles={['ADMIN']} />,
                children: [
                  { path: '/admin/dashboard', element: <AdminDashboard />, handle: { breadcrumb: 'Administração' } },
                  { path: '/admin/users', element: <AdminUsers />, handle: { breadcrumb: 'Utilizadores' } },
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
              { path: '/login', element: <Login /> },
              { path: '/register', element: <Register /> },
            ],
          },
        ],
      },
      // Bare routes
      { path: '/', element: <SmartRedirect /> },
      { path: '/verify-email', element: <VerifyEmail /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
