import { BatchingWebSocket } from './batching-web-socket';
import { InProcessWebSocketWorker } from './web-socket-worker';

describe('OMCT-C06-L2-04.05 Batching WebSocket', () => {
  it('routes endpoint messages to the matching logical subscribers', () => {
    const worker = new InProcessWebSocketWorker();
    const socket = new BatchingWebSocket(worker);
    const channelA: unknown[] = [];
    const channelB: unknown[] = [];

    socket.subscribe('telemetry:a', (payload) => channelA.push(payload));
    socket.subscribe('telemetry:b', (payload) => channelB.push(payload));

    worker.receive({ channel: 'telemetry:a', payload: { value: 1 } });
    worker.receive({ channel: 'telemetry:b', payload: { value: 2 } });

    expect(channelA).toEqual([{ value: 1 }]);
    expect(channelB).toEqual([{ value: 2 }]);
  });

  it('stops routing to a channel after its last subscriber unsubscribes', () => {
    const worker = new InProcessWebSocketWorker();
    const socket = new BatchingWebSocket(worker);
    const received: unknown[] = [];

    const stop = socket.subscribe('telemetry:a', (payload) => received.push(payload));
    stop();
    worker.receive({ channel: 'telemetry:a', payload: { value: 1 } });

    expect(received).toEqual([]);
  });
});
