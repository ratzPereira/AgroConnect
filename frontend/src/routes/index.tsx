import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
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
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/requests', element: <Requests /> },
          { path: '/requests/new', element: <CreateRequest /> },
          { path: '/requests/:id', element: <RequestDetail /> },
          { path: '/transactions', element: <Transactions /> },
          { path: '/notifications', element: <Notifications /> },
          {
            element: <RoleRoute allowedRoles={['PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR']} />,
            children: [
              { path: '/provider/dashboard', element: <ProviderDashboard /> },
              { path: '/provider/team', element: <Team /> },
              { path: '/provider/machines', element: <Machines /> },
              { path: '/provider/inventory', element: <Inventory /> },
              { path: '/provider/finance', element: <Finance /> },
            ],
          },
          {
            element: <RoleRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: '/admin/dashboard', element: <AdminDashboard /> },
              { path: '/admin/users', element: <AdminUsers /> },
            ],
          },
        ],
      },
    ],
  },
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
  { path: '/verify-email', element: <VerifyEmail /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '*', element: <NotFound /> },
]);
