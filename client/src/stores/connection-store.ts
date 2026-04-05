import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Connection } from '@/types/transmission';

export type AutoConnect = 'none' | 'last' | 'first';

interface ConnectionState {
  connections: Connection[];
  loaded: boolean;

  loadConnections: () => Promise<void>;
  addConnection: (data: Omit<Connection, 'id'>) => Promise<Connection>;
  updateConnection: (id: number, data: Partial<Connection>) => Promise<void>;
  deleteConnection: (id: number) => Promise<void>;
  getConnectionById: (id: number) => Connection | undefined;
}

export const useConnectionStore = create<ConnectionState>()((set, get) => ({
  connections: [],
  loaded: false,

  loadConnections: async () => {
    const res = await fetch('/api/connections');
    if (!res.ok) throw new Error('Failed to load connections');
    const connections = (await res.json()) as Connection[];
    set({ connections, loaded: true });
  },

  addConnection: async (data) => {
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create connection');
    const conn = (await res.json()) as Connection;
    set((state) => ({ connections: [...state.connections, conn] }));
    return conn;
  },

  updateConnection: async (id, data) => {
    const res = await fetch(`/api/connections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update connection');
    const conn = (await res.json()) as Connection;
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? conn : c)),
    }));
  },

  deleteConnection: async (id) => {
    const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete connection');
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }));
  },

  getConnectionById: (id) => {
    return get().connections.find((c) => c.id === id);
  },
}));

// UI preferences (browser-local)
interface ConnectionPrefsState {
  autoConnect: AutoConnect;
  lastConnectionId: number | null;
  setAutoConnect: (mode: AutoConnect) => void;
  setLastConnectionId: (id: number | null) => void;
}

export const useConnectionPrefs = create<ConnectionPrefsState>()(
  persist(
    (set) => ({
      autoConnect: 'none' as AutoConnect,
      lastConnectionId: null as number | null,
      setAutoConnect: (mode) => set({ autoConnect: mode }),
      setLastConnectionId: (id) => set({ lastConnectionId: id }),
    }),
    { name: 'transmission-connection-prefs' },
  ),
);
