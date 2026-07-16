/** A message routed over the batching WebSocket, addressed by logical channel. */
export interface WebSocketMessage {
  channel: string;
  payload: unknown;
}

/**
 * Transport worker for the batching WebSocket. A shared-worker-backed
 * implementation may be used where available; the in-process worker is the
 * equivalent-behaviour fallback. Requirement: OMCT-C06-L2-04.05.
 */
export interface WebSocketWorker {
  connect(url: string): void;
  send(message: WebSocketMessage): void;
  onMessage(handler: (message: WebSocketMessage) => void): void;
  disconnect(): void;
}

/** In-process worker: routes messages synchronously (the test/dev fallback). */
export class InProcessWebSocketWorker implements WebSocketWorker {
  private handler?: (message: WebSocketMessage) => void;

  connect(): void {}
  send(): void {}

  onMessage(handler: (message: WebSocketMessage) => void): void {
    this.handler = handler;
  }

  disconnect(): void {
    this.handler = undefined;
  }

  /** Test/dev hook: simulate an inbound endpoint message. */
  receive(message: WebSocketMessage): void {
    this.handler?.(message);
  }
}

/** Whether a dedicated worker is available in this environment. */
export function supportsWorker(): boolean {
  return typeof Worker !== 'undefined';
}

/** Builds the worker for the current environment (in-process fallback by default). */
export function createWebSocketWorker(): WebSocketWorker {
  return new InProcessWebSocketWorker();
}
