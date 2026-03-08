import { useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TORRENT_STATUS } from '@/lib/utils';
import { useAppStore, type SidebarFilter } from '@/stores/app-store';
import { addTorrent, rpc } from '@/api/transmission';
import type { Torrent } from '@/types/transmission';
import {
  Download, CheckCircle, Play, Pause, Square, AlertCircle, Clock, List, Upload,
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
  const { sidebarFilter, setSidebarFilter, activeConnectionId } = useAppStore();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

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

  const handleFiles = useCallback(async (files: FileList) => {
    if (!activeConnectionId) {
      toast.error('Aucune connexion active');
      return;
    }

    const torrentFiles = Array.from(files).filter(
      (f) => f.name.endsWith('.torrent') || f.type === 'application/x-bittorrent',
    );

    if (torrentFiles.length === 0) {
      toast.error('Aucun fichier .torrent détecté');
      return;
    }

    setIsAdding(true);
    let added = 0;

    for (const file of torrentFiles) {
      try {
        const base64 = await fileToBase64(file);
        const result = await addTorrent(activeConnectionId, { metainfo: base64 });
        // Start immediately (bypass queue)
        const added_torrent = result?.['torrent-added'] || result?.['torrent-duplicate'];
        if (added_torrent?.id) {
          await rpc(activeConnectionId, 'torrent-start-now', { ids: [added_torrent.id] });
        }
        added++;
      } catch (err) {
        toast.error(`${file.name}: ${err instanceof Error ? err.message : 'Erreur'}`);
      }
    }

    if (added > 0) {
      queryClient.invalidateQueries({ queryKey: ['torrents'] });
      toast.success(added === 1 ? 'Torrent ajouté et démarré' : `${added} torrents ajoutés et démarrés`);
    }
    setIsAdding(false);
  }, [activeConnectionId, queryClient]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }, [handleFiles]);

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

      {/* Drop zone for .torrent files */}
      <div className="mt-auto p-2 border-t border-border">
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-1 p-3 rounded-md border-2 border-dashed cursor-pointer transition-all',
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-accent/50',
            isAdding && 'opacity-50 pointer-events-none',
            !activeConnectionId && 'opacity-30 pointer-events-none',
          )}
        >
          <input
            type="file"
            accept=".torrent"
            multiple
            onChange={onFileInput}
            className="hidden"
            disabled={!activeConnectionId || isAdding}
          />
          <Upload size={18} className={cn('text-muted-foreground', isDragging && 'text-primary')} />
          <span className={cn('text-[11px] text-center text-muted-foreground leading-tight', isDragging && 'text-primary font-medium')}>
            {isAdding ? 'Ajout en cours...' : isDragging ? 'Déposer ici' : 'Glisser un .torrent ici'}
          </span>
        </label>
      </div>
    </aside>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
