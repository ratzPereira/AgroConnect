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

  it('persists accepted consent to localStorage', async () => {
    const mod = await import('../cookieStore');
    mod.useCookieStore.getState().accept();
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBe('accepted');
  });

  it('persists rejected consent to localStorage', async () => {
    const mod = await import('../cookieStore');
    mod.useCookieStore.getState().reject();
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBe('rejected');
  });

  it('loads accepted consent from localStorage on initialization', async () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    const mod = await import('../cookieStore');
    expect(mod.useCookieStore.getState().consent).toBe('accepted');
  });

  it('loads rejected consent from localStorage on initialization', async () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    const mod = await import('../cookieStore');
    expect(mod.useCookieStore.getState().consent).toBe('rejected');
  });

  it('can change from accepted to rejected', async () => {
    const mod = await import('../cookieStore');
    mod.useCookieStore.getState().accept();
    expect(mod.useCookieStore.getState().consent).toBe('accepted');

    mod.useCookieStore.getState().reject();
    expect(mod.useCookieStore.getState().consent).toBe('rejected');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('rejected');
  });

  it('can change from rejected to accepted', async () => {
    const mod = await import('../cookieStore');
    mod.useCookieStore.getState().reject();
    expect(mod.useCookieStore.getState().consent).toBe('rejected');

    mod.useCookieStore.getState().accept();
    expect(mod.useCookieStore.getState().consent).toBe('accepted');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('accepted');
  });
});
