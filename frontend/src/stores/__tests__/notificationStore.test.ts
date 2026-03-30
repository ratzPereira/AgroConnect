import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('notificationStore', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('starts with unreadCount 0', async () => {
    const mod = await import('../notificationStore');
    const state = mod.useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
  });

  it('setUnreadCount updates count to given value', async () => {
    const mod = await import('../notificationStore');
    mod.useNotificationStore.getState().setUnreadCount(5);
    expect(mod.useNotificationStore.getState().unreadCount).toBe(5);
  });

  it('incrementUnread increments count by 1', async () => {
    const mod = await import('../notificationStore');
    mod.useNotificationStore.getState().setUnreadCount(3);
    mod.useNotificationStore.getState().incrementUnread();
    expect(mod.useNotificationStore.getState().unreadCount).toBe(4);
  });

  it('incrementUnread called multiple times accumulates', async () => {
    const mod = await import('../notificationStore');
    mod.useNotificationStore.getState().incrementUnread();
    mod.useNotificationStore.getState().incrementUnread();
    mod.useNotificationStore.getState().incrementUnread();
    expect(mod.useNotificationStore.getState().unreadCount).toBe(3);
  });

  it('resetUnread sets count back to 0', async () => {
    const mod = await import('../notificationStore');
    mod.useNotificationStore.getState().setUnreadCount(10);
    mod.useNotificationStore.getState().resetUnread();
    expect(mod.useNotificationStore.getState().unreadCount).toBe(0);
  });
});
