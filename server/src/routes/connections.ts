import { Hono } from 'hono';
import {
  listConnections,
  getConnection,
  createConnection,
  updateConnection,
  deleteConnection,
} from '../lib/db.js';

const app = new Hono();

app.get('/', (c) => {
  return c.json(listConnections());
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const conn = createConnection({
    name: body.name ?? 'Nouvelle connexion',
    host: body.host ?? 'localhost',
    port: body.port ?? 9091,
    ssl: !!body.ssl,
    username: body.username ?? '',
    password: body.password ?? '',
    rpc_path: body.rpc_path ?? '/transmission/rpc',
    auto_reconnect: body.auto_reconnect ?? true,
  });
  return c.json(conn);
});

app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const conn = updateConnection(id, body);
  if (!conn) return c.json({ error: 'Not found' }, 404);
  return c.json(conn);
});

app.delete('/:id', (c) => {
  const id = Number(c.req.param('id'));
  const ok = deleteConnection(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

app.get('/:id', (c) => {
  const id = Number(c.req.param('id'));
  const conn = getConnection(id);
  if (!conn) return c.json({ error: 'Not found' }, 404);
  return c.json(conn);
});

export default app;
