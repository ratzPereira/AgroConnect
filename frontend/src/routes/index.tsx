import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Requests } from '@/pages/Requests';
import { CreateRequest } from '@/pages/CreateRequest';
import { RequestDetail } from '@/pages/RequestDetail';
import { Transactions } from '@/pages/Transactions';
import { Notifications } from '@/pages/Notifications';
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
  { path: '*', element: <NotFound /> },
]);
