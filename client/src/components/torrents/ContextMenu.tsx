import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import {
  startTorrents, stopTorrents, removeTorrents, verifyTorrents,
  setTorrent, getTorrents, rpc,
} from '@/api/transmission';
import { useTorrentDetails, useTorrents } from '@/hooks/useTorrents';
import {
  FolderOpen, Play, FastForward, Square, Trash2, CheckCircle,
  RefreshCw, Link, MapPin, PenLine, Info, ChevronRight,
  Copy, Gauge, Tag, CheckSquare, ToggleLeft,
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
  checked?: boolean;
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
        {item.checked !== undefined && (
          <span className="text-[11px]">{item.checked ? '✓' : ''}</span>
        )}
        {item.shortcut && <span className="text-muted-foreground text-[11px] ml-4">{item.shortcut}</span>}
        {hasSubmenu && <ChevronRight size={12} className="text-muted-foreground" />}
      </button>
      {hasSubmenu && (
        <div className="hidden group-hover:block absolute left-full top-0 z-[60]">
          <div className="bg-background border border-border rounded-md shadow-xl py-1 min-w-[180px]">
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
  const { data: allTorrents = [] } = useTorrents();

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

  // --- Actions ---

  const copyPath = async () => {
    try {
      if (isSingle && torrentDetail?.downloadDir) {
        await navigator.clipboard.writeText(torrentDetail.downloadDir);
        toast.success('Chemin copié dans le presse-papiers');
      }
    } catch {
      toast.error('Impossible de copier');
    }
    onClose();
  };

  const copyName = async () => {
    try {
      if (isSingle && torrentDetail?.name) {
        await navigator.clipboard.writeText(torrentDetail.name);
        toast.success('Nom copié');
      } else if (isMulti) {
        const data = await getTorrents(connId, ['id', 'name'], ids);
        const names = (data.torrents as Array<{ id: number; name: string }>)
          .map((t) => t.name)
          .filter(Boolean);
        if (names.length > 0) {
          await navigator.clipboard.writeText(names.join('\n'));
          toast.success(`${names.length} nom(s) copié(s)`);
        }
      }
    } catch {
      toast.error('Impossible de copier');
    }
    onClose();
  };

  const copyMagnet = async () => {
    try {
      if (isSingle && torrentDetail?.magnetLink) {
        await navigator.clipboard.writeText(torrentDetail.magnetLink);
        toast.success('Lien magnet copié');
      } else if (isMulti) {
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
    const current = isSingle && torrentDetail ? torrentDetail.downloadDir : '';
    const newLocation = prompt('Nouvel emplacement des données:', current);
    if (newLocation) {
      const move = confirm('Déplacer les fichiers existants vers le nouvel emplacement ?');
      act(() => rpc(connId, 'torrent-set-location', { ids, location: newLocation, move }), 'Déplacer');
    } else {
      onClose();
    }
  };

  const rename = () => {
    if (!torrentDetail) return;
    const newName = prompt('Nouveau nom:', torrentDetail.name);
    if (newName && newName !== torrentDetail.name) {
      act(() => rpc(connId, 'torrent-rename-path', { ids: [torrentDetail.id], path: torrentDetail.name, name: newName }), 'Renommer');
    } else {
      onClose();
    }
  };

  const reannounce = () => {
    act(() => rpc(connId, 'torrent-reannounce', { ids }), 'Relancer');
  };

  const setSpeedLimit = (key: 'downloadLimit' | 'uploadLimit', enabledKey: 'downloadLimited' | 'uploadLimited', value: number | null) => {
    if (value === null) {
      // Disable limit
      act(() => setTorrent(connId, ids, { [enabledKey]: false }), 'Limite');
    } else {
      act(() => setTorrent(connId, ids, { [enabledKey]: true, [key]: value }), 'Limite');
    }
  };

  const setCustomSpeedLimit = (direction: 'download' | 'upload') => {
    const label = direction === 'download' ? 'téléchargement' : 'envoi';
    const key = direction === 'download' ? 'downloadLimit' : 'uploadLimit';
    const enabledKey = direction === 'download' ? 'downloadLimited' : 'uploadLimited';
    const current = torrentDetail?.[key] ?? 0;
    const input = prompt(`Limite de ${label} (Ko/s):`, String(current));
    if (input !== null) {
      const val = parseInt(input, 10);
      if (!isNaN(val) && val > 0) {
        act(() => setTorrent(connId, ids, { [enabledKey]: true, [key]: val }), 'Limite');
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const manageLabels = async () => {
    // Get current labels for single torrent or prompt for new label
    const currentLabels = torrentDetail?.labels?.join(', ') ?? '';
    const input = prompt('Étiquettes (séparées par des virgules):', currentLabels);
    if (input !== null) {
      const labels = input.split(',').map((l) => l.trim()).filter(Boolean);
      act(() => setTorrent(connId, ids, { labels }), 'Étiquettes');
    } else {
      onClose();
    }
  };

  const selectAll = () => {
    useAppStore.getState().setSelectedTorrentIds(allTorrents.map((t) => t.id));
    onClose();
  };

  const invertSelection = () => {
    const currentIds = new Set(selectedTorrentIds);
    const inverted = allTorrents.filter((t) => !currentIds.has(t.id)).map((t) => t.id);
    useAppStore.getState().setSelectedTorrentIds(inverted);
    onClose();
  };

  // Speed limit indicators for single torrent
  const dlLimited = torrentDetail?.downloadLimited ?? false;
  const ulLimited = torrentDetail?.uploadLimited ?? false;
  const dlLimit = torrentDetail?.downloadLimit ?? 0;
  const ulLimit = torrentDetail?.uploadLimit ?? 0;

  // --- Build menu items ---
  const items: MenuItem[] = [];

  // "Open folder" only for single selection
  if (isSingle) {
    items.push({
      label: 'Copier le chemin du dossier',
      icon: <FolderOpen size={14} />,
      shortcut: 'Ctrl+Enter',
      action: copyPath,
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

  // Start / Force start / Stop
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

  // Remove
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

  // Priority & Queue
  items.push(
    {
      label: 'Priorité',
      icon: null,
      submenu: [
        { label: 'Haute', action: () => act(() => setTorrent(connId, ids, { bandwidthPriority: 1 }), 'Priorité'), checked: torrentDetail?.bandwidthPriority === 1 },
        { label: 'Normale', action: () => act(() => setTorrent(connId, ids, { bandwidthPriority: 0 }), 'Priorité'), checked: torrentDetail?.bandwidthPriority === 0 },
        { label: 'Basse', action: () => act(() => setTorrent(connId, ids, { bandwidthPriority: -1 }), 'Priorité'), checked: torrentDetail?.bandwidthPriority === -1 },
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

  // Speed limits per torrent
  items.push(
    {
      label: `Limite téléchargement${dlLimited && isSingle ? ` (${dlLimit} Ko/s)` : ''}`,
      icon: <Gauge size={14} />,
      submenu: [
        { label: 'Illimitée', action: () => setSpeedLimit('downloadLimit', 'downloadLimited', null), checked: isSingle && !dlLimited },
        { separator: true, label: '' },
        { label: '50 Ko/s', action: () => setSpeedLimit('downloadLimit', 'downloadLimited', 50) },
        { label: '100 Ko/s', action: () => setSpeedLimit('downloadLimit', 'downloadLimited', 100) },
        { label: '250 Ko/s', action: () => setSpeedLimit('downloadLimit', 'downloadLimited', 250) },
        { label: '500 Ko/s', action: () => setSpeedLimit('downloadLimit', 'downloadLimited', 500) },
        { label: '1000 Ko/s', action: () => setSpeedLimit('downloadLimit', 'downloadLimited', 1000) },
        { label: '2500 Ko/s', action: () => setSpeedLimit('downloadLimit', 'downloadLimited', 2500) },
        { separator: true, label: '' },
        { label: 'Personnalisée...', action: () => setCustomSpeedLimit('download') },
      ],
      disabled: !hasSelection,
    },
    {
      label: `Limite envoi${ulLimited && isSingle ? ` (${ulLimit} Ko/s)` : ''}`,
      icon: <Gauge size={14} />,
      submenu: [
        { label: 'Illimitée', action: () => setSpeedLimit('uploadLimit', 'uploadLimited', null), checked: isSingle && !ulLimited },
        { separator: true, label: '' },
        { label: '50 Ko/s', action: () => setSpeedLimit('uploadLimit', 'uploadLimited', 50) },
        { label: '100 Ko/s', action: () => setSpeedLimit('uploadLimit', 'uploadLimited', 100) },
        { label: '250 Ko/s', action: () => setSpeedLimit('uploadLimit', 'uploadLimited', 250) },
        { label: '500 Ko/s', action: () => setSpeedLimit('uploadLimit', 'uploadLimited', 500) },
        { label: '1000 Ko/s', action: () => setSpeedLimit('uploadLimit', 'uploadLimited', 1000) },
        { label: '2500 Ko/s', action: () => setSpeedLimit('uploadLimit', 'uploadLimited', 2500) },
        { separator: true, label: '' },
        { label: 'Personnalisée...', action: () => setCustomSpeedLimit('upload') },
      ],
      disabled: !hasSelection,
    },
    {
      label: 'Respecter les limites de session',
      icon: <ToggleLeft size={14} />,
      action: () => act(() => setTorrent(connId, ids, { honorsSessionLimits: !(torrentDetail?.honorsSessionLimits ?? true) }), 'Session limits'),
      checked: isSingle ? (torrentDetail?.honorsSessionLimits ?? true) : undefined,
      disabled: !hasSelection,
    },
  );

  items.push({ separator: true, label: '' });

  // Reannounce & Verify
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

  // Copy submenu
  items.push({
    label: 'Copier',
    icon: <Copy size={14} />,
    submenu: [
      { label: isMulti ? `${count} noms` : 'Nom', action: copyName },
      { label: isMulti ? `${count} Magnet Links` : 'Magnet Link', action: copyMagnet },
    ],
    disabled: !hasSelection,
  });

  // Labels
  items.push({
    label: 'Étiquettes...',
    icon: <Tag size={14} />,
    action: manageLabels,
    disabled: !hasSelection,
  });

  // Set location
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

  // Selection
  items.push(
    {
      label: 'Sélectionner tout',
      icon: <CheckSquare size={14} />,
      shortcut: 'Ctrl+A',
      action: selectAll,
    },
    {
      label: 'Inverser la sélection',
      icon: null,
      action: invertSelection,
    },
  );

  // Properties — only single
  if (isSingle) {
    items.push({ separator: true, label: '' });
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
