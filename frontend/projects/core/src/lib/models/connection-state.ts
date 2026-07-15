/**
 * B04 — CouchDB-analogue connection vocabulary (OMCT-C04-L2-02.06):
 * `pending` while a connection attempt or reconnect is in flight, `connected`
 * and `disconnected` for known states, and `unknown` before the first attempt.
 */
export type ConnectionState = 'pending' | 'connected' | 'disconnected' | 'unknown';
