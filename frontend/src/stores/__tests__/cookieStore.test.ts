import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEY = 'agroconnect-cookie-consent';

describe('cookieStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('starts with null consent when no localStorage', async () => {
    const mod = await import('../cookieStore');
    expect(mod.useCookieStore.getState().consent).toBeNull();
  });

  it('accept sets consent to accepted', async () => {
    const mod = await import('../cookieStore');
    mod.useCookieStore.getState().accept();
    expect(mod.useCookieStore.getState().consent).toBe('accepted');
  });

  it('reject sets consent to rejected', async () => {
    const mod = await import('../cookieStore');
    mod.useCookieStore.getState().reject();
    expect(mod.useCookieStore.getState().consent).toBe('rejected');
  });

  it('persists consent to localStorage', async () => {
    const mod = await import('../cookieStore');
    mod.useCookieStore.getState().accept();
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBe('accepted');
  });
});
