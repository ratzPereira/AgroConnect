import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('starts with no authentication when localStorage is empty', async () => {
    const mod = await import('../authStore');
    const state = mod.useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setTokens stores tokens in localStorage and state', async () => {
    const mod = await import('../authStore');
    mod.useAuthStore.getState().setTokens('access123', 'refresh456');
    expect(mod.useAuthStore.getState().accessToken).toBe('access123');
    expect(mod.useAuthStore.getState().refreshToken).toBe('refresh456');
    expect(mod.useAuthStore.getState().isAuthenticated).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('access123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh456');
  });

  it('setUser persists user to localStorage', async () => {
    const mod = await import('../authStore');
    const user = { id: 1, name: 'Test', email: 'test@test.pt', role: 'CLIENT' as const };
    mod.useAuthStore.getState().setUser(user);
    expect(mod.useAuthStore.getState().user).toEqual(user);
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(user);
  });

  it('logout clears everything', async () => {
    localStorage.setItem('accessToken', 'token');
    localStorage.setItem('refreshToken', 'refresh');
    localStorage.setItem('user', '{"id":1}');
    const mod = await import('../authStore');
    mod.useAuthStore.getState().logout();
    expect(mod.useAuthStore.getState().user).toBeNull();
    expect(mod.useAuthStore.getState().accessToken).toBeNull();
    expect(mod.useAuthStore.getState().refreshToken).toBeNull();
    expect(mod.useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('clearTokens removes tokens and user', async () => {
    const mod = await import('../authStore');
    mod.useAuthStore.getState().setTokens('a', 'b');
    mod.useAuthStore.getState().clearTokens();
    expect(mod.useAuthStore.getState().accessToken).toBeNull();
    expect(mod.useAuthStore.getState().refreshToken).toBeNull();
    expect(mod.useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('initializes from localStorage on load', async () => {
    localStorage.setItem('accessToken', 'saved-token');
    localStorage.setItem('refreshToken', 'saved-refresh');
    localStorage.setItem('user', JSON.stringify({ id: 2, name: 'Saved', email: 'x@x.pt', role: 'CLIENT' }));
    const mod = await import('../authStore');
    const state = mod.useAuthStore.getState();
    expect(state.accessToken).toBe('saved-token');
    expect(state.refreshToken).toBe('saved-refresh');
    expect(state.user?.name).toBe('Saved');
    expect(state.isAuthenticated).toBe(true);
  });
});
