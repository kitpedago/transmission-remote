// Generic RPC call through our backend proxy
async function rpc(connectionId: number, method: string, args?: Record<string, unknown>) {
  const res = await fetch(`/api/rpc/${connectionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, arguments: args }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `RPC error: ${res.status}`);
  }
  const data = await res.json();
  if (data.result && data.result !== 'success') {
    throw new Error(data.result);
  }
  return data.arguments;
}

// Torrent operations
export function getTorrents(connectionId: number, fields: readonly string[], ids?: number[] | 'recently-active') {
  return rpc(connectionId, 'torrent-get', { fields: [...fields], ...(ids ? { ids } : {}) });
}

export function startTorrents(connectionId: number, ids: number[]) {
  return rpc(connectionId, 'torrent-start', { ids });
}

export function stopTorrents(connectionId: number, ids: number[]) {
  return rpc(connectionId, 'torrent-stop', { ids });
}

export function removeTorrents(connectionId: number, ids: number[], deleteLocalData: boolean) {
  return rpc(connectionId, 'torrent-remove', { ids, 'delete-local-data': deleteLocalData });
}

export function verifyTorrents(connectionId: number, ids: number[]) {
  return rpc(connectionId, 'torrent-verify', { ids });
}

export function setTorrent(connectionId: number, ids: number[], props: Record<string, unknown>) {
  return rpc(connectionId, 'torrent-set', { ids, ...props });
}

export function moveTorrent(connectionId: number, ids: number[], location: string, move: boolean) {
  return rpc(connectionId, 'torrent-set-location', { ids, location, move });
}

export function addTorrent(connectionId: number, args: { filename?: string; metainfo?: string; 'download-dir'?: string; paused?: boolean }) {
  return rpc(connectionId, 'torrent-add', args);
}

export function startAllTorrents(connectionId: number) {
  return rpc(connectionId, 'torrent-start');
}

export function stopAllTorrents(connectionId: number) {
  return rpc(connectionId, 'torrent-stop');
}

// Session operations
export function getSession(connectionId: number) {
  return rpc(connectionId, 'session-get');
}

export function setSession(connectionId: number, args: Record<string, unknown>) {
  return rpc(connectionId, 'session-set', args);
}

export function getSessionStats(connectionId: number) {
  return rpc(connectionId, 'session-stats');
}

export function getFreeSpace(connectionId: number, path: string) {
  return rpc(connectionId, 'free-space', { path });
}
