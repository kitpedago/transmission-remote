import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Connection } from '@/types/transmission';

export type AutoConnect = 'none' | 'last' | 'first';

interface ConnectionState {
  connections: Connection[];
  nextId: number;
  autoConnect: AutoConnect;
  lastConnectionId: number | null;

  addConnection: (data: Omit<Connection, 'id'>) => Connection;
  updateConnection: (id: number, data: Partial<Connection>) => void;
  deleteConnection: (id: number) => void;
  getConnectionById: (id: number) => Connection | undefined;
  setAutoConnect: (mode: AutoConnect) => void;
  setLastConnectionId: (id: number | null) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      nextId: 1,
      autoConnect: 'none' as AutoConnect,
      lastConnectionId: null as number | null,

      addConnection: (data) => {
        const id = get().nextId;
        const conn: Connection = { ...data, id };
        set((state) => ({
          connections: [...state.connections, conn],
          nextId: state.nextId + 1,
        }));
        return conn;
      },

      updateConnection: (id, data) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        }));
      },

      deleteConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        }));
      },

      getConnectionById: (id) => {
        return get().connections.find((c) => c.id === id);
      },

      setAutoConnect: (mode) => set({ autoConnect: mode }),
      setLastConnectionId: (id) => set({ lastConnectionId: id }),
    }),
    {
      name: 'transmission-connections',
    },
  ),
);
