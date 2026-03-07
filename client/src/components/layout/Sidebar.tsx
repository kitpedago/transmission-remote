import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TORRENT_STATUS } from '@/lib/utils';
import { useAppStore, type SidebarFilter } from '@/stores/app-store';
import type { Torrent } from '@/types/transmission';
import {
  Download, CheckCircle, Play, Pause, Square, AlertCircle, Clock, List,
} from 'lucide-react';

interface SidebarProps {
  torrents: Torrent[];
}

interface FilterItem {
  key: SidebarFilter;
  label: string;
  icon: React.ReactNode;
  count: (t: Torrent[]) => number;
  color?: string;
}

const filters: FilterItem[] = [
  {
    key: 'all',
    label: 'Tous les torrents',
    icon: <List size={14} />,
    count: (t) => t.length,
  },
  {
    key: 'downloading',
    label: 'Téléchargement',
    icon: <Download size={14} />,
    count: (t) => t.filter((x) => x.status === TORRENT_STATUS.DOWNLOAD || x.status === TORRENT_STATUS.DOWNLOAD_WAIT).length,
    color: 'text-blue-600',
  },
  {
    key: 'completed',
    label: 'Terminés',
    icon: <CheckCircle size={14} />,
    count: (t) => t.filter((x) => x.percentDone >= 1).length,
    color: 'text-green-600',
  },
  {
    key: 'active',
    label: 'Actifs',
    icon: <Play size={14} />,
    count: (t) => t.filter((x) => x.rateDownload > 0 || x.rateUpload > 0).length,
    color: 'text-green-600',
  },
  {
    key: 'inactive',
    label: 'Inactifs',
    icon: <Pause size={14} />,
    count: (t) => t.filter((x) => x.status !== TORRENT_STATUS.STOPPED && x.rateDownload === 0 && x.rateUpload === 0).length,
  },
  {
    key: 'stopped',
    label: 'Arrêtés',
    icon: <Square size={14} />,
    count: (t) => t.filter((x) => x.status === TORRENT_STATUS.STOPPED).length,
  },
  {
    key: 'error',
    label: 'Erreur',
    icon: <AlertCircle size={14} />,
    count: (t) => t.filter((x) => x.error > 0).length,
    color: 'text-red-600',
  },
  {
    key: 'queued',
    label: 'En attente',
    icon: <Clock size={14} />,
    count: (t) => t.filter((x) => x.status === TORRENT_STATUS.DOWNLOAD_WAIT || x.status === TORRENT_STATUS.SEED_WAIT).length,
  },
];

export function Sidebar({ torrents }: SidebarProps) {
  const { sidebarFilter, setSidebarFilter } = useAppStore();

  const trackers = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of torrents) {
      for (const ts of t.trackerStats || []) {
        try {
          const host = new URL(ts.announce).hostname;
          map.set(host, (map.get(host) || 0) + 1);
        } catch { /* ignore */ }
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [torrents]);

  return (
    <aside className="w-52 border-r border-border bg-muted/30 flex flex-col overflow-y-auto shrink-0">
      <div className="p-2 space-y-0.5">
        {filters.map((f) => {
          const count = f.count(torrents);
          return (
            <button
              key={f.key}
              onClick={() => setSidebarFilter(f.key)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[13px] hover:bg-accent transition-colors',
                sidebarFilter === f.key && 'bg-accent font-medium',
                f.color,
              )}
            >
              {f.icon}
              <span className="flex-1 truncate">{f.label}</span>
              <span className="text-muted-foreground text-xs">({count})</span>
            </button>
          );
        })}
      </div>

      {trackers.length > 0 && (
        <div className="p-2 border-t border-border">
          <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Trackers</div>
          {trackers.map(([host, count]) => (
            <div
              key={host}
              className="flex items-center gap-2 px-2 py-0.5 text-[12px] text-muted-foreground truncate"
              title={host}
            >
              <span className="truncate flex-1">{host}</span>
              <span>({count})</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
