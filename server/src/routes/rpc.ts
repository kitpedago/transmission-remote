import { Hono } from 'hono';
import { db } from '../db/index.js';
import { proxyRpc } from '../lib/rpc-proxy.js';
import type { ConnectionRow } from '../db/schema.js';

const app = new Hono();

// Proxy RPC request to Transmission daemon
app.post('/:connectionId', async (c) => {
  const connectionId = c.req.param('connectionId');
  const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId) as ConnectionRow | undefined;

  if (!conn) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  try {
    const body = await c.req.json();
    const result = await proxyRpc(conn, body);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RPC proxy error';
    return c.json({ error: message }, 502);
  }
});

export default app;
