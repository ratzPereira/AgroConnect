import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBreadcrumbs } from '../useBreadcrumbs';

vi.mock('react-router-dom', () => ({
  useMatches: vi.fn(() => []),
}));

describe('useBreadcrumbs', () => {
  it('should return empty array when no handles', () => {
    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toEqual([]);
  });

  it('should build breadcrumbs from route handles', async () => {
    const { useMatches } = await import('react-router-dom');
    vi.mocked(useMatches).mockReturnValue([
      { id: '1', pathname: '/', handle: { breadcrumb: 'Dashboard' }, params: {}, data: undefined, loaderData: undefined },
      { id: '2', pathname: '/requests', handle: { breadcrumb: 'Pedidos' }, params: {}, data: undefined, loaderData: undefined },
      { id: '3', pathname: '/requests/5', handle: { breadcrumb: 'Detalhes' }, params: {}, data: undefined, loaderData: undefined },
    ]);

    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toEqual([
      { label: 'Dashboard', to: '/' },
      { label: 'Pedidos', to: '/requests' },
      { label: 'Detalhes', to: undefined },
    ]);

    vi.mocked(useMatches).mockReturnValue([]);
  });

  it('should skip routes without breadcrumb handle', async () => {
    const { useMatches } = await import('react-router-dom');
    vi.mocked(useMatches).mockReturnValue([
      { id: '1', pathname: '/', handle: undefined, params: {}, data: undefined, loaderData: undefined },
      { id: '2', pathname: '/requests', handle: { breadcrumb: 'Pedidos' }, params: {}, data: undefined, loaderData: undefined },
    ]);

    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toEqual([
      { label: 'Pedidos', to: undefined },
    ]);

    vi.mocked(useMatches).mockReturnValue([]);
  });
});
