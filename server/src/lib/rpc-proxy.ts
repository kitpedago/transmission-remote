import type { ConnectionRow } from '../db/schema.js';

// Cache CSRF session IDs per connection
const sessionIds = new Map<number, string>();

export async function proxyRpc(conn: ConnectionRow, body: unknown): Promise<unknown> {
  const protocol = conn.ssl ? 'https' : 'http';
  const url = `${protocol}://${conn.host}:${conn.port}${conn.rpc_path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (conn.username) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${conn.username}:${conn.password}`).toString('base64');
  }

  const cachedSessionId = sessionIds.get(conn.id);
  if (cachedSessionId) {
    headers['X-Transmission-Session-Id'] = cachedSessionId;
  }

  let res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  // Handle CSRF 409: Transmission requires session ID
  if (res.status === 409) {
    const newSessionId = res.headers.get('X-Transmission-Session-Id');
    if (newSessionId) {
      sessionIds.set(conn.id, newSessionId);
      headers['X-Transmission-Session-Id'] = newSessionId;
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    }
  }

  if (!res.ok) {
    throw new Error(`Transmission RPC error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export function clearSessionId(connectionId: number) {
  sessionIds.delete(connectionId);
}
