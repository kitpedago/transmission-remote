import { useMemo, useEffect, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn, formatBytes, formatSpeed, formatEta, formatRatio, formatDate, getStatusLabel, TORRENT_STATUS } from '@/lib/utils';
import { useAppStore, type SidebarFilter } from '@/stores/app-store';
import { startTorrents, stopTorrents, removeTorrents, verifyTorrents } from '@/api/transmission';
import { ContextMenu } from './ContextMenu';
import type { Torrent } from '@/types/transmission';
import { ArrowUp, ArrowDown } from 'lucide-react';

const col = createColumnHelper<Torrent>();

const columns = [
  col.accessor('id', { header: 'ID', size: 50 }),
  col.accessor('addedDate', {
    header: 'Ajouté le',
    size: 90,
    cell: (info) => formatDate(info.getValue()),
  }),
  col.accessor('name', { header: 'Nom', size: 400 }),
  col.accessor('totalSize', {
    header: 'Taille',
    size: 80,
    cell: (info) => formatBytes(info.getValue()),
  }),
  col.accessor('percentDone', {
    header: 'Accompli',
    size: 100,
    cell: (info) => {
      const pct = info.getValue();
      const status = info.row.original.status;
      const isComplete = pct >= 1;
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-3 bg-gray-200 rounded-sm overflow-hidden">
            <div
              className={cn(
                'h-full rounded-sm transition-all',
                isComplete ? 'bg-green-500' : status === TORRENT_STATUS.DOWNLOAD ? 'bg-blue-500' : 'bg-blue-300',
              )}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <span className={cn('text-xs min-w-[40px] text-right', isComplete && 'text-green-600 font-medium')}>
            {(pct * 100).toFixed(1)}%
          </span>
        </div>
      );
    },
  }),
  col.display({
    id: 'status',
    header: 'Statut',
    size: 80,
    cell: (info) => {
      const t = info.row.original;
      const label = getStatusLabel(t.status, t.percentDone, t.error);
      return (
        <span className={cn(
          'text-xs',
          t.error > 0 && 'text-red-600',
          t.percentDone >= 1 && t.error === 0 && 'text-green-600',
          t.status === TORRENT_STATUS.DOWNLOAD && 'text-blue-600',
        )}>
          {label}
        </span>
      );
    },
  }),
  col.accessor('peersSendingToUs', { header: 'Sources', size: 60 }),
  col.accessor('peersConnected', { header: 'Pairs', size: 60 }),
  col.accessor('rateDownload', {
    header: 'Vitesse tél',
    size: 90,
    cell: (info) => info.getValue() > 0 ? formatSpeed(info.getValue()) : '',
  }),
  col.accessor('rateUpload', {
    header: 'Vitesse env',
    size: 90,
    cell: (info) => info.getValue() > 0 ? formatSpeed(info.getValue()) : '',
  }),
  col.accessor('eta', {
    header: 'Temps restant',
    size: 90,
    cell: (info) => {
      const eta = info.getValue();
      return eta > 0 ? formatEta(eta) : '';
    },
  }),
  col.accessor('uploadRatio', {
    header: 'Ratio',
    size: 70,
    cell: (info) => formatRatio(info.getValue()),
  }),
];

function filterTorrents(torrents: Torrent[], filter: SidebarFilter): Torrent[] {
  switch (filter) {
    case 'downloading':
      return torrents.filter((t) => t.status === TORRENT_STATUS.DOWNLOAD || t.status === TORRENT_STATUS.DOWNLOAD_WAIT);
    case 'completed':
      return torrents.filter((t) => t.percentDone >= 1);
    case 'active':
      return torrents.filter((t) => t.rateDownload > 0 || t.rateUpload > 0);
    case 'inactive':
      return torrents.filter((t) => t.status !== TORRENT_STATUS.STOPPED && t.rateDownload === 0 && t.rateUpload === 0);
    case 'stopped':
      return torrents.filter((t) => t.status === TORRENT_STATUS.STOPPED);
    case 'error':
      return torrents.filter((t) => t.error > 0);
    case 'queued':
      return torrents.filter((t) => t.status === TORRENT_STATUS.DOWNLOAD_WAIT || t.status === TORRENT_STATUS.SEED_WAIT);
    default:
      return torrents;
  }
}

interface TorrentTableProps {
  torrents: Torrent[];
}

export function TorrentTable({ torrents }: TorrentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const queryClient = useQueryClient();
  const { sidebarFilter, selectedTorrentIds, toggleTorrentSelection, setSelectedTorrentIds, activeConnectionId } = useAppStore();

  const filtered = useMemo(() => filterTorrents(torrents, sidebarFilter), [torrents, sidebarFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
  });

  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['torrents'] }), [queryClient]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!activeConnectionId) return;
    const ids = useAppStore.getState().selectedTorrentIds;
    const connId = activeConnectionId;

    const handleKeyDown = async (e: KeyboardEvent) => {
      const ids = useAppStore.getState().selectedTorrentIds;
      if (!ids.length && !['F3'].includes(e.key)) return;

      try {
        if (e.key === 'F3' && !e.shiftKey) {
          e.preventDefault();
          await startTorrents(connId, ids);
          invalidate();
        } else if (e.key === 'F3' && e.shiftKey) {
          e.preventDefault();
          await fetch(`/api/rpc/${connId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'torrent-start-now', arguments: { ids } }) });
          invalidate();
        } else if (e.key === 'F4') {
          e.preventDefault();
          await stopTorrents(connId, ids);
          invalidate();
        } else if (e.key === 'Delete' && !e.shiftKey) {
          e.preventDefault();
          if (confirm('Enlever les torrents sélectionnés ?')) {
            await removeTorrents(connId, ids, false);
            invalidate();
          }
        } else if (e.key === 'Delete' && e.shiftKey) {
          e.preventDefault();
          if (confirm('Enlever les torrents ET supprimer les données locales ?')) {
            await removeTorrents(connId, ids, true);
            invalidate();
          }
        } else if (e.key === 'r' && e.ctrlKey) {
          e.preventDefault();
          await fetch(`/api/rpc/${connId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'torrent-reannounce', arguments: { ids } }) });
          invalidate();
          toast.success('Relancé');
        } else if (e.key === 'a' && e.ctrlKey) {
          e.preventDefault();
          useAppStore.getState().setSelectedTorrentIds(filtered.map((t) => t.id));
        } else if (e.key === 'Enter' && e.altKey) {
          e.preventDefault();
          useAppStore.getState().setDetailPanelOpen(true);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeConnectionId, filtered, invalidate]);

  const handleContextMenu = (e: React.MouseEvent, torrentId: number) => {
    e.preventDefault();
    // If right-clicked torrent is not in selection, select it
    if (!selectedTorrentIds.includes(torrentId)) {
      useAppStore.getState().setSelectedTorrentIds([torrentId]);
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="flex-1 overflow-auto relative">
      <table className="w-full text-[13px]">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-1 text-left font-medium text-muted-foreground border-b border-border cursor-pointer select-none hover:bg-accent whitespace-nowrap"
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: <ArrowUp size={12} />,
                      desc: <ArrowDown size={12} />,
                    }[header.column.getIsSorted() as string] ?? null}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = selectedTorrentIds.includes(row.original.id);
            return (
              <tr
                key={row.id}
                className={cn(
                  'cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50',
                  isSelected && 'bg-primary/10',
                )}
                onClick={(e) => {
                  const visibleIds = table.getRowModel().rows.map((r) => r.original.id);
                  toggleTorrentSelection(row.original.id, e.ctrlKey || e.metaKey, e.shiftKey, visibleIds);
                }}
                onDoubleClick={() => useAppStore.getState().setDetailPanelOpen(true)}
                onContextMenu={(e) => handleContextMenu(e, row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-0.5 whitespace-nowrap truncate" style={{ maxWidth: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                Aucun torrent
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onShowProperties={() => useAppStore.getState().setDetailPanelOpen(true)}
        />
      )}
    </div>
  );
}
