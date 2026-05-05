import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthLayout } from '../AuthLayout';

describe('AuthLayout', () => {
  it('renders children via Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<div>Login Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login Page Content')).toBeInTheDocument();
  });

  it('renders Outlet content for different routes', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<div>Register Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Register Page Content')).toBeInTheDocument();
  });
});
