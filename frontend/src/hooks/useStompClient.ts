import { useEffect, useRef, useCallback } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/authStore';

let stompClient: Client | null = null;
let subscriberCount = 0;

// Registry of subscribe functions to re-run on every connect/reconnect
const pendingSubscriptions = new Set<() => void>();

function getOrCreateClient(token: string): Client {
  if (stompClient && stompClient.active) return stompClient;

  stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws') as WebSocket,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      // On every connect/reconnect, resubscribe all registered subscribers
      pendingSubscriptions.forEach((fn) => fn());
    },
  });

  stompClient.activate();
  return stompClient;
}

export function useStompSubscription(
  destination: string,
  callback: (msg: IMessage) => void,
  enabled = true,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!enabled || !token) return;

    const client = getOrCreateClient(token);
    subscriberCount++;

    let sub: StompSubscription | null = null;

    const subscribe = () => {
      // Unsubscribe previous if reconnecting to avoid duplicates
      if (sub) {
        try { sub.unsubscribe(); } catch { /* already closed */ }
      }
      sub = client.subscribe(destination, (msg) => {
        callbackRef.current(msg);
      });
    };

    if (client.connected) {
      subscribe();
    }

    // Register for reconnection
    pendingSubscriptions.add(subscribe);

    return () => {
      pendingSubscriptions.delete(subscribe);
      if (sub) {
        try { sub.unsubscribe(); } catch { /* already closed */ }
      }
      subscriberCount--;
      if (subscriberCount <= 0 && stompClient) {
        stompClient.deactivate();
        stompClient = null;
        subscriberCount = 0;
      }
    };
  }, [destination, enabled, token]);
}

export function useStompPublish() {
  const token = useAuthStore((s) => s.accessToken);

  return useCallback(
    (destination: string, body: string) => {
      if (!token) return;
      const client = getOrCreateClient(token);
      if (client.connected) {
        client.publish({ destination, body });
      }
    },
    [token],
  );
}
