import { useEffect, useRef, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/authStore';

let stompClient: Client | null = null;
let subscriberCount = 0;

function getOrCreateClient(token: string): Client {
  if (stompClient && stompClient.connected) return stompClient;

  stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws') as WebSocket,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
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

    let subId: { unsubscribe: () => void } | null = null;

    const subscribe = () => {
      subId = client.subscribe(destination, (msg) => {
        callbackRef.current(msg);
      });
    };

    if (client.connected) {
      subscribe();
    } else {
      const originalOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        originalOnConnect?.(frame);
        subscribe();
      };
    }

    return () => {
      subId?.unsubscribe();
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
