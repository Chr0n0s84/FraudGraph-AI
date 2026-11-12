import { useEffect, useRef, useState, useCallback } from 'react';
import { Transaction, Alert } from '../types';

interface WebSocketMessage {
  event: string;
  transaction?: Transaction;
  alert?: Alert;
}

export function useWebSocketStream(
  onTransaction?: (tx: Transaction) => void,
  onAlert?: (alert: Alert) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestTx, setLatestTx] = useState<Transaction | null>(null);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/live`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected to live transaction feed');
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (data.event === 'NEW_TRANSACTION' && data.transaction) {
            setLatestTx(data.transaction);
            if (onTransaction) onTransaction(data.transaction);

            if (data.alert) {
              setLatestAlert(data.alert);
              if (onAlert) onAlert(data.alert);
              // Show toast
              setToastMessage(`🚨 ${data.alert.severity} Risk Alert: ${data.alert.title}`);
              setTimeout(() => setToastMessage(null), 5000);
            }
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WebSocket] Connection closed. Reconnecting in 3s...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket] Error encountered', err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('[WebSocket] Setup error', e);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [onTransaction, onAlert]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return {
    isConnected,
    latestTx,
    latestAlert,
    toastMessage,
    dismissToast: () => setToastMessage(null),
  };
}

