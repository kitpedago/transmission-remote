// Connection info passed from the client
export interface ConnectionInfo {
  host: string;
  port: number;
  ssl: boolean;
  username: string;
  password: string;
  rpc_path: string;
}

// Cache CSRF session IDs per connection (keyed by host:port)
const sessionIds = new Map<string, string>();

function cacheKey(conn: ConnectionInfo): string {
  return `${conn.host}:${conn.port}`;
}

export async function proxyRpc(conn: ConnectionInfo, body: unknown): Promise<unknown> {
  const protocol = conn.ssl ? 'https' : 'http';
  const url = `${protocol}://${conn.host}:${conn.port}${conn.rpc_path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (conn.username) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${conn.username}:${conn.password}`).toString('base64');
  }

  const key = cacheKey(conn);
  const cachedSessionId = sessionIds.get(key);
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
      sessionIds.set(key, newSessionId);
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
