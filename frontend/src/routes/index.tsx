import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Requests } from '@/pages/Requests';
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
