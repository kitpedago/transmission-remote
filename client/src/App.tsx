import { useEffect, useRef } from 'react';
import { Toolbar } from '@/components/layout/Toolbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { TorrentTable } from '@/components/torrents/TorrentTable';
import { DetailPanel } from '@/components/details/DetailPanel';
import { useTorrents } from '@/hooks/useTorrents';
import { useAppStore } from '@/stores/app-store';
import { useConnectionStore } from '@/stores/connection-store';

export default function App() {
  const { activeConnectionId, setActiveConnection } = useAppStore();
  const didAutoConnect = useRef(false);

  // Auto-connect on startup
  useEffect(() => {
    if (didAutoConnect.current) return;
    didAutoConnect.current = true;

    const { autoConnect, lastConnectionId, connections } = useConnectionStore.getState();
    if (autoConnect === 'none' || connections.length === 0) return;

    if (autoConnect === 'last' && lastConnectionId) {
      const exists = connections.find((c) => c.id === lastConnectionId);
      if (exists) {
        setActiveConnection(lastConnectionId);
        return;
      }
    }
    // 'first' or fallback when 'last' connection no longer exists
    if (autoConnect === 'first' || autoConnect === 'last') {
      setActiveConnection(connections[0].id);
    }
  }, [setActiveConnection]);

  // Track last used connection
  useEffect(() => {
    if (activeConnectionId) {
      useConnectionStore.getState().setLastConnectionId(activeConnectionId);
    }
  }, [activeConnectionId]);
  const { data: torrents = [], isLoading, error } = useTorrents();

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />

      <div className="flex flex-1 min-h-0">
        <Sidebar torrents={torrents} />

        <div className="flex-1 flex flex-col min-w-0">
          {!activeConnectionId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-lg">Transmission Remote</p>
                <p className="text-sm">Sélectionnez ou créez une connexion pour commencer</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-destructive">
              <p>Erreur de connexion: {error.message}</p>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Connexion en cours...</p>
            </div>
          ) : (
            <>
              <TorrentTable torrents={torrents} />
              <DetailPanel />
            </>
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
