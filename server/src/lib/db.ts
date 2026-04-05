import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'server/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'transmission-remote.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    ssl INTEGER NOT NULL DEFAULT 0,
    username TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',
    rpc_path TEXT NOT NULL DEFAULT '/transmission/rpc',
    auto_reconnect INTEGER NOT NULL DEFAULT 1
  );
`);

export interface ConnectionRow {
  id: number;
  name: string;
  host: string;
  port: number;
  ssl: number;
  username: string;
  password: string;
  rpc_path: string;
  auto_reconnect: number;
}

export interface Connection {
  id: number;
  name: string;
  host: string;
  port: number;
  ssl: boolean;
  username: string;
  password: string;
  rpc_path: string;
  auto_reconnect: boolean;
}

function rowToConnection(row: ConnectionRow): Connection {
  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    ssl: !!row.ssl,
    username: row.username,
    password: row.password,
    rpc_path: row.rpc_path,
    auto_reconnect: !!row.auto_reconnect,
  };
}

export function listConnections(): Connection[] {
  const rows = db.prepare('SELECT * FROM connections ORDER BY id').all() as ConnectionRow[];
  return rows.map(rowToConnection);
}

export function getConnection(id: number): Connection | null {
  const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as ConnectionRow | undefined;
  return row ? rowToConnection(row) : null;
}

export function createConnection(data: Omit<Connection, 'id'>): Connection {
  const stmt = db.prepare(`
    INSERT INTO connections (name, host, port, ssl, username, password, rpc_path, auto_reconnect)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.host,
    data.port,
    data.ssl ? 1 : 0,
    data.username,
    data.password,
    data.rpc_path,
    data.auto_reconnect ? 1 : 0,
  );
  return getConnection(Number(result.lastInsertRowid))!;
}

export function updateConnection(id: number, data: Partial<Omit<Connection, 'id'>>): Connection | null {
  const current = getConnection(id);
  if (!current) return null;
  const merged = { ...current, ...data };
  db.prepare(`
    UPDATE connections
    SET name = ?, host = ?, port = ?, ssl = ?, username = ?, password = ?, rpc_path = ?, auto_reconnect = ?
    WHERE id = ?
  `).run(
    merged.name,
    merged.host,
    merged.port,
    merged.ssl ? 1 : 0,
    merged.username,
    merged.password,
    merged.rpc_path,
    merged.auto_reconnect ? 1 : 0,
    id,
  );
  return getConnection(id);
}

export function deleteConnection(id: number): boolean {
  const result = db.prepare('DELETE FROM connections WHERE id = ?').run(id);
  return result.changes > 0;
}
