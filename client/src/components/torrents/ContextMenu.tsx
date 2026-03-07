import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import {
  startTorrents, stopTorrents, removeTorrents, verifyTorrents,
  setTorrent, getTorrents, rpc,
} from '@/api/transmission';
import { useTorrentDetails } from '@/hooks/useTorrents';
import {
  FolderOpen, Play, FastForward, Square, Trash2, CheckCircle,
  RefreshCw, Link, MapPin, PenLine, Info, ChevronRight,
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onShowProperties: () => void;
}

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
}

function MenuItemRow({ item }: { item: MenuItem }) {
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  if (item.separator) {
    return <div className="border-t border-border my-1" />;
  }

  return (
    <div className="relative group">
      <button
        onClick={() => { if (!hasSubmenu && item.action) item.action(); }}
        disabled={item.disabled}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-default ${item.danger ? 'text-destructive' : ''}`}
      >
        <span className="w-4 shrink-0">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        {item.shortcut && <span className="text-muted-foreground text-[11px] ml-4">{item.shortcut}</span>}
        {hasSubmenu && <ChevronRight size={12} className="text-muted-foreground" />}
      </button>
      {hasSubmenu && (
        <div className="hidden group-hover:block absolute left-full top-0 z-[60]">
          <div className="bg-background border border-border rounded-md shadow-xl py-1 min-w-[160px]">
            {item.submenu!.map((sub, i) => (
              <MenuItemRow key={i} item={sub} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ContextMenu({ x, y, onClose, onShowProperties }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { activeConnectionId, selectedTorrentIds } = useAppStore();
  const isSingle = selectedTorrentIds.length === 1;
  const isMulti = selectedTorrentIds.length > 1;
  const torrentId = isSingle ? selectedTorrentIds[0] : null;
  const { data: torrentDetail } = useTorrentDetails(torrentId);

  const connId = activeConnectionId!;
  const ids = selectedTorrentIds;
  const hasSelection = ids.length > 0;
  const count = ids.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['torrents'] });

  const act = useCallback(async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn();
      invalidate();
      onClose();
    } catch (err) {
      toast.error(`${label}: ${err instanceof Error ? err.message : 'Erreur'}`);
    }
  }, [connId, ids]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 280);
  const adjustedY = Math.min(y, window.innerHeight - 500);

  const copyMagnet = async () => {
    try {
      if (isSingle && torrentDetail?.magnetLink) {
        await navigator.clipboard.writeText(torrentDetail.magnetLink);
        toast.success('Lien magnet copié');
      } else if (isMulti) {
        // Fetch magnet links for all selected torrents
        const data = await getTorrents(connId, ['id', 'magnetLink'], ids);
        const magnets = (data.torrents as Array<{ id: number; magnetLink: string }>)
          .map((t) => t.magnetLink)
          .filter(Boolean);
        if (magnets.length > 0) {
          await navigator.clipboard.writeText(magnets.join('\n'));
          toast.success(`${magnets.length} lien(s) magnet copié(s)`);
        } else {
          toast.error('Aucun lien magnet disponible');
        }
      }
    } catch {
      toast.error('Impossible de copier');
    }
    onClose();
  };

  const setLocation = () => {
    const newLocation = prompt('Nouvel emplacement des données:');
    if (newLocation) {
      act(() => rpc(connId, 'torrent-set-location', { ids, location: newLocation, move: true }), 'Déplacer');
    }
  };

  const rename = () => {
    if (!torrentDetail) return;
    const newName = prompt('Nouveau nom:', torrentDetail.name);
    if (newName && newName !== torrentDetail.name) {
      act(() => rpc(connId, 'torrent-rename-path', { ids: [torrentDetail.id], path: torrentDetail.name, name: newName }), 'Renommer');
    }
  };

  const reannounce = () => {
    act(() => rpc(connId, 'torrent-reannounce', { ids }), 'Relancer');
  };

  // Build menu items — some are hidden or adapted for multi-selection
  const items: MenuItem[] = [];

  // "Open folder" only for single selection
  if (isSingle) {
    items.push({
      label: 'Ouvrir le dossier de destination',
      icon: <FolderOpen size={14} />,
      shortcut: 'Ctrl+Enter',
      action: () => {
        if (torrentDetail?.downloadDir) {
          toast.info(`Dossier: ${torrentDetail.downloadDir}`);
        }
        onClose();
      },
      disabled: !torrentDetail,
    });
    items.push({ separator: true, label: '' });
  }

  // Multi-selection header
  if (isMulti) {
    items.push({
      label: `${count} torrents sélectionnés`,
      icon: null,
      disabled: true,
    });
    items.push({ separator: true, label: '' });
  }

  // Start / Force start / Stop — always available
  items.push(
    {
      label: 'Démarrer',
      icon: <Play size={14} />,
      shortcut: 'F3',
      action: () => act(() => startTorrents(connId, ids), 'Démarrer'),
      disabled: !hasSelection,
    },
    {
      label: 'Forcer le démarrage',
      icon: <FastForward size={14} />,
      shortcut: 'Shift+F3',
      action: () => act(() => rpc(connId, 'torrent-start-now', { ids }), 'Forcer le démarrage'),
      disabled: !hasSelection,
    },
    {
      label: 'Arrêter',
      icon: <Square size={14} />,
      shortcut: 'F4',
      action: () => act(() => stopTorrents(connId, ids), 'Arrêter'),
      disabled: !hasSelection,
    },
  );

  // Remove — adapt label for multi
  items.push(
    {
      label: isMulti ? `Enlever ${count} torrents` : 'Enlever',
      icon: <Trash2 size={14} />,
      shortcut: 'Del',
      action: () => {
        const msg = isMulti
          ? `Enlever les ${count} torrents sélectionnés ?`
          : 'Enlever le torrent sélectionné ?';
        if (confirm(msg)) {
          act(() => removeTorrents(connId, ids, false), 'Enlever');
        }
      },
      disabled: !hasSelection,
      danger: true,
    },
    {
      label: isMulti ? `Enlever ${count} torrents et les données` : 'Enlever le torrent et les données',
      icon: <Trash2 size={14} />,
      shortcut: 'Shift+Del',
      action: () => {
        const msg = isMulti
          ? `Enlever les ${count} torrents ET supprimer les données locales ?`
          : 'Enlever le torrent ET supprimer les données locales ?';
        if (confirm(msg)) {
          act(() => removeTorrents(connId, ids, true), 'Enlever + données');
        }
      },
      disabled: !hasSelection,
      danger: true,
    },
  );

  items.push({ separator: true, label: '' });

  // Priority & Queue — available for single and multi
  items.push(
    {
      label: 'Priorité',
      icon: null,
      submenu: [
        { label: 'Haute', action: () => act(() => setTorrent(connId, ids, { bandwidthPriority: 1 }), 'Priorité') },
        { label: 'Normale', action: () => act(() => setTorrent(connId, ids, { bandwidthPriority: 0 }), 'Priorité') },
        { label: 'Basse', action: () => act(() => setTorrent(connId, ids, { bandwidthPriority: -1 }), 'Priorité') },
      ],
      disabled: !hasSelection,
    },
    {
      label: 'File',
      icon: null,
      submenu: [
        { label: 'Monter dans la file', action: () => act(() => rpc(connId, 'queue-move-up', { ids }), 'File') },
        { label: 'Descendre dans la file', action: () => act(() => rpc(connId, 'queue-move-down', { ids }), 'File') },
        { label: 'En haut de la file', action: () => act(() => rpc(connId, 'queue-move-top', { ids }), 'File') },
        { label: 'En bas de la file', action: () => act(() => rpc(connId, 'queue-move-bottom', { ids }), 'File') },
      ],
      disabled: !hasSelection,
    },
  );

  items.push({ separator: true, label: '' });

  // Reannounce & Verify — available for both
  items.push(
    {
      label: 'Relancer (obtenir plus de pairs)',
      icon: <RefreshCw size={14} />,
      shortcut: 'Ctrl+R',
      action: reannounce,
      disabled: !hasSelection,
    },
    {
      label: 'Vérifier',
      icon: <CheckCircle size={14} />,
      action: () => act(() => verifyTorrents(connId, ids), 'Vérifier'),
      disabled: !hasSelection,
    },
  );

  items.push({ separator: true, label: '' });

  // Copy Magnet — available for both (fetches all magnet links for multi)
  items.push({
    label: isMulti ? `Copier ${count} Magnet Links` : 'Copier Magnet Link',
    icon: <Link size={14} />,
    action: copyMagnet,
    disabled: !hasSelection,
  });

  // Set location — available for both
  items.push({ separator: true, label: '' });
  items.push({
    label: 'Définir l\'emplacement des données...',
    icon: <MapPin size={14} />,
    shortcut: 'F6',
    action: setLocation,
    disabled: !hasSelection,
  });

  // Rename — only single
  if (isSingle) {
    items.push({
      label: 'Renommer',
      icon: <PenLine size={14} />,
      shortcut: 'F2',
      action: rename,
      disabled: !torrentDetail,
    });
  }

  items.push({ separator: true, label: '' });

  // Properties — only single
  if (isSingle) {
    items.push({
      label: 'Propriétés...',
      icon: <Info size={14} />,
      shortcut: 'Alt+Enter',
      action: () => { onShowProperties(); onClose(); },
    });
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-background border border-border rounded-md shadow-xl py-1 min-w-[260px] z-50"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, i) => (
        <MenuItemRow key={i} item={item} />
      ))}
    </div>
  );
}
