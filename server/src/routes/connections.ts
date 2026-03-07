import { Hono } from 'hono';
import { db } from '../db/index.js';
import { rowToConnection, type ConnectionRow } from '../db/schema.js';

const app = new Hono();

// List all connections
app.get('/', (c) => {
  const rows = db.prepare('SELECT * FROM connections ORDER BY name').all() as ConnectionRow[];
  return c.json(rows.map(rowToConnection));
});

// Get single connection
app.get('/:id', (c) => {
  const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(c.req.param('id')) as ConnectionRow | undefined;
  if (!row) return c.json({ error: 'Connection not found' }, 404);
  return c.json(rowToConnection(row));
});

// Create connection
app.post('/', async (c) => {
  const body = await c.req.json();
  const stmt = db.prepare(`
    INSERT INTO connections (name, host, port, ssl, username, password, rpc_path, auto_reconnect)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    body.name || 'New Connection',
    body.host || 'localhost',
    body.port ?? 9091,
    body.ssl ? 1 : 0,
    body.username || '',
    body.password || '',
    body.rpc_path || '/transmission/rpc',
    body.auto_reconnect !== false ? 1 : 0,
  );
  const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(result.lastInsertRowid) as ConnectionRow;
  return c.json(rowToConnection(row), 201);
});

// Update connection
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const existing = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as ConnectionRow | undefined;
  if (!existing) return c.json({ error: 'Connection not found' }, 404);

  const stmt = db.prepare(`
    UPDATE connections SET name=?, host=?, port=?, ssl=?, username=?, password=?, rpc_path=?, auto_reconnect=?, updated_at=datetime('now')
    WHERE id=?
  `);
  stmt.run(
    body.name ?? existing.name,
    body.host ?? existing.host,
    body.port ?? existing.port,
    body.ssl !== undefined ? (body.ssl ? 1 : 0) : existing.ssl,
    body.username ?? existing.username,
    body.password ?? existing.password,
    body.rpc_path ?? existing.rpc_path,
    body.auto_reconnect !== undefined ? (body.auto_reconnect ? 1 : 0) : existing.auto_reconnect,
    id,
  );
  const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as ConnectionRow;
  return c.json(rowToConnection(row));
});

// Delete connection
app.delete('/:id', (c) => {
  const result = db.prepare('DELETE FROM connections WHERE id = ?').run(c.req.param('id'));
  if (result.changes === 0) return c.json({ error: 'Connection not found' }, 404);
  return c.json({ ok: true });
});

export default app;
