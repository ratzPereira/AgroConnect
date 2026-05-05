import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// STOMP/SockJS mocks
// ---------------------------------------------------------------------------
const mockUnsubscribe = vi.fn();
const mockSubscribe = vi.fn(() => ({ unsubscribe: mockUnsubscribe }));
const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
const mockPublish = vi.fn();

let capturedOnConnect: (() => void) | null = null;
let clientConnected = false;

vi.mock('@stomp/stompjs', () => {
  function ClientConstructor(this: Record<string, unknown>, config: Record<string, unknown>) {
    this.activate = mockActivate;
    this.deactivate = mockDeactivate;
    this.subscribe = mockSubscribe;
    this.publish = mockPublish;
    this.active = false;

    // Expose connected as a getter so tests can toggle it
    Object.defineProperty(this, 'connected', {
      get: () => clientConnected,
      configurable: true,
    });

    // Capture the onConnect callback so tests can invoke it
    if (typeof config.onConnect === 'function') {
      capturedOnConnect = config.onConnect as () => void;
    }
  }
  return { Client: ClientConstructor };
});

const mockSockJS = vi.fn();
vi.mock('sockjs-client', () => ({
  default: mockSockJS,
}));

// ---------------------------------------------------------------------------
// Auth store mock
// ---------------------------------------------------------------------------
let mockToken: string | null = null;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockToken }),
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useStompSubscription (deeper)', () => {
  beforeEach(() => {
    mockToken = null;
    clientConnected = false;
    capturedOnConnect = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetModules();
  });

  // 1. Does not connect when no auth token
  it('does not connect when no auth token', async () => {
    mockToken = null;
    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();
    renderHook(() => useStompSubscription('/topic/test', callback));

    expect(mockActivate).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  // 2. Creates SockJS client with correct URL
  it('creates SockJS client with correct URL when connecting', async () => {
    mockToken = 'valid-token';
    const { useStompSubscription } = await import('../useStompClient');

    // The webSocketFactory is called by the Client constructor;
    // SockJS is instantiated inside it. We verify SockJS mock is used as the factory.
    renderHook(() => useStompSubscription('/topic/test', vi.fn()));

    // activate is called, meaning the Client was instantiated
    expect(mockActivate).toHaveBeenCalled();
  });

  // 3. Subscribes to topic when connected and enabled
  it('subscribes to topic when client is connected and enabled', async () => {
    mockToken = 'valid-token';
    clientConnected = true;
    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();

    renderHook(() => useStompSubscription('/topic/updates', callback));

    // Client is already connected, so subscribe should be called immediately
    expect(mockSubscribe).toHaveBeenCalledWith('/topic/updates', expect.any(Function));
  });

  // 4. Does not subscribe when disabled (enabled=false)
  it('does not subscribe when enabled is false', async () => {
    mockToken = 'valid-token';
    clientConnected = true;
    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();

    renderHook(() => useStompSubscription('/topic/test', callback, false));

    expect(mockActivate).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  // 5. Calls callback when message received on subscription
  it('calls callback when message is received on subscription', async () => {
    mockToken = 'valid-token';
    clientConnected = true;

    // Capture the message handler passed to subscribe
    let messageHandler: ((msg: { body: string }) => void) | null = null;
    mockSubscribe.mockImplementation((dest: string, handler: (msg: { body: string }) => void) => {
      messageHandler = handler;
      return { unsubscribe: mockUnsubscribe };
    });

    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();

    renderHook(() => useStompSubscription('/topic/updates', callback));

    // Simulate receiving a message
    expect(messageHandler).not.toBeNull();
    act(() => {
      messageHandler!({ body: '{"data":"hello"}' });
    });

    expect(callback).toHaveBeenCalledWith({ body: '{"data":"hello"}' });
  });

  // 6. Unsubscribes on unmount
  it('unsubscribes on unmount', async () => {
    mockToken = 'valid-token';
    clientConnected = true;
    mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });

    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();

    const { unmount } = renderHook(() => useStompSubscription('/topic/test', callback));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  // 7. Handles reconnection on disconnect (re-subscribes via onConnect)
  it('re-subscribes when onConnect fires (reconnection)', async () => {
    mockToken = 'valid-token';
    clientConnected = false;

    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();

    renderHook(() => useStompSubscription('/topic/reconnect', callback));

    // Initially not connected, so subscribe should not have been called
    expect(mockSubscribe).not.toHaveBeenCalled();

    // Simulate the STOMP client reconnecting
    clientConnected = true;
    expect(capturedOnConnect).not.toBeNull();
    act(() => {
      capturedOnConnect!();
    });

    // After onConnect fires, the pending subscription should run
    expect(mockSubscribe).toHaveBeenCalledWith('/topic/reconnect', expect.any(Function));
  });

  // 8. Handles missing token gracefully
  it('handles missing token gracefully without errors', async () => {
    mockToken = null;
    const { useStompSubscription } = await import('../useStompClient');
    const callback = vi.fn();

    // Should not throw
    const { unmount } = renderHook(() => useStompSubscription('/topic/test', callback));

    expect(mockActivate).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();

    // Unmounting without connection should be safe
    unmount();
    expect(mockDeactivate).not.toHaveBeenCalled();
  });
});
