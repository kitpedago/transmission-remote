import type { Connection } from '@/types/transmission';

const BASE = '/api/connections';

export async function fetchConnections(): Promise<Connection[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch connections');
  return res.json();
}

export async function createConnection(data: Partial<Connection>): Promise<Connection> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create connection');
  return res.json();
}

export async function updateConnection(id: number, data: Partial<Connection>): Promise<Connection> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update connection');
  return res.json();
}

export async function deleteConnection(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete connection');
}
