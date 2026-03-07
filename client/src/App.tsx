import { Toolbar } from '@/components/layout/Toolbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { TorrentTable } from '@/components/torrents/TorrentTable';
import { DetailPanel } from '@/components/details/DetailPanel';
import { useTorrents } from '@/hooks/useTorrents';
import { useAppStore } from '@/stores/app-store';

export default function App() {
  const { activeConnectionId } = useAppStore();
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
