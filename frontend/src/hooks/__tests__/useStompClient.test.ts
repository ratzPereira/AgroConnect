import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
const mockSubscribe = vi.fn(() => ({ unsubscribe: vi.fn() }));
const mockPublish = vi.fn();

vi.mock('@stomp/stompjs', () => {
  const ClientMock = function (this: Record<string, unknown>) {
    this.activate = mockActivate;
    this.deactivate = mockDeactivate;
    this.subscribe = mockSubscribe;
    this.publish = mockPublish;
    this.connected = false;
    this.active = false;
  };
  return { Client: ClientMock };
});

vi.mock('sockjs-client', () => ({
  default: vi.fn(),
}));

let mockToken: string | null = null;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockToken }),
  ),
}));

describe('useStompSubscription', () => {
  beforeEach(() => {
    mockToken = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('does nothing when token is null', async () => {
    mockToken = null;
    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();
    renderHook(() => useStompSubscription('/topic/test', callback));

    expect(mockActivate).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does nothing when enabled is false', async () => {
    mockToken = 'valid-token';
    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();
    renderHook(() => useStompSubscription('/topic/test', callback, false));

    expect(mockActivate).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('creates client and activates when token is present and enabled', async () => {
    mockToken = 'valid-token';
    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();
    renderHook(() => useStompSubscription('/topic/test', callback));

    expect(mockActivate).toHaveBeenCalled();
  });
});

describe('useStompPublish', () => {
  beforeEach(() => {
    mockToken = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns a function', async () => {
    mockToken = null;
    const { useStompPublish } = await import('../useStompClient');
    const { result } = renderHook(() => useStompPublish());

    expect(typeof result.current).toBe('function');
  });

  it('does not publish when token is null', async () => {
    mockToken = null;
    const { useStompPublish } = await import('../useStompClient');
    const { result } = renderHook(() => useStompPublish());

    result.current('/app/send', '{"text": "hello"}');
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
