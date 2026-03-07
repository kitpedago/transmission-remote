import { Hono } from 'hono';
import { proxyRpc, type ConnectionInfo } from '../lib/rpc-proxy.js';

const app = new Hono();

// Stateless RPC proxy — connection details come in the request body
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { connection, method, arguments: args } = body as {
      connection: ConnectionInfo;
      method: string;
      arguments?: Record<string, unknown>;
    };

    if (!connection || !method) {
      return c.json({ error: 'Missing connection or method' }, 400);
    }

    const rpcBody = { method, arguments: args };
    const result = await proxyRpc(connection, rpcBody);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RPC proxy error';
    return c.json({ error: message }, 502);
  }
});

export default app;
