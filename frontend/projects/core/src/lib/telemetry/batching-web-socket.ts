import { WebSocketWorker, createWebSocketWorker } from './web-socket-worker';

/**
 * Multiplexes logical telemetry subscriptions over one batching WebSocket worker,
 * routing each endpoint message to the subscribers of its channel.
 * Requirement: OMCT-C06-L2-04.05.
 */
export class BatchingWebSocket {
  private readonly subscribers = new Map<string, Set<(payload: unknown) => void>>();

  constructor(private readonly worker: WebSocketWorker = createWebSocketWorker()) {
    this.worker.onMessage((message) => {
      this.subscribers.get(message.channel)?.forEach((callback) => callback(message.payload));
    });
  }

  connect(url: string): void {
    this.worker.connect(url);
  }

  subscribe(channel: string, callback: (payload: unknown) => void): () => void {
    const callbacks = this.subscribers.get(channel) ?? new Set<(payload: unknown) => void>();
    callbacks.add(callback);
    this.subscribers.set(channel, callbacks);
    this.worker.send({ channel, payload: { subscribe: true } });

    return () => {
      const current = this.subscribers.get(channel);
      if (!current) {
        return;
      }
      current.delete(callback);
      if (current.size === 0) {
        this.subscribers.delete(channel);
      }
    };
  }

  disconnect(): void {
    this.worker.disconnect();
    this.subscribers.clear();
  }
}
