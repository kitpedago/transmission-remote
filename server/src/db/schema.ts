import Database from 'better-sqlite3';

export function initDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      host TEXT NOT NULL DEFAULT 'localhost',
      port INTEGER NOT NULL DEFAULT 9091,
      ssl INTEGER NOT NULL DEFAULT 0,
      username TEXT NOT NULL DEFAULT '',
      password TEXT NOT NULL DEFAULT '',
      rpc_path TEXT NOT NULL DEFAULT '/transmission/rpc',
      auto_reconnect INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
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
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export function rowToConnection(row: ConnectionRow): Connection {
  return {
    ...row,
    ssl: row.ssl === 1,
    auto_reconnect: row.auto_reconnect === 1,
  };
}
