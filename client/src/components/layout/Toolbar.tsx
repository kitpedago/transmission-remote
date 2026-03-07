import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { fetchConnections } from '@/api/connections';
import {
  startTorrents, stopTorrents, removeTorrents, verifyTorrents,
  startAllTorrents, stopAllTorrents, addTorrent,
} from '@/api/transmission';
import { ConnectionDialog } from '@/components/dialogs/ConnectionDialog';
import { AddTorrentDialog } from '@/components/dialogs/AddTorrentDialog';
import { OptionsDialog } from '@/components/dialogs/OptionsDialog';
import {
  Plus, Play, Square, Trash2, CheckCircle, Settings, FolderPlus,
  PlayCircle, StopCircle, Settings2,
} from 'lucide-react';

export function Toolbar() {
  const queryClient = useQueryClient();
  const { activeConnectionId, setActiveConnection, selectedTorrentIds } = useAppStore();
  const { data: connections = [] } = useQuery({ queryKey: ['connections'], queryFn: fetchConnections });

  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [addTorrentOpen, setAddTorrentOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const hasSelection = selectedTorrentIds.length > 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['torrents'] });

  const handleAction = async (action: () => Promise<unknown>, label: string) => {
    try {
      await action();
      invalidate();
    } catch (err) {
      toast.error(`${label}: ${err instanceof Error ? err.message : 'Erreur'}`);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/30">
        {/* Connection selector */}
        <select
          className="h-7 px-2 rounded border border-border bg-background text-sm min-w-[180px]"
          value={activeConnectionId ?? ''}
          onChange={(e) => setActiveConnection(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- Connexion --</option>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={() => setConnectionDialogOpen(true)} className="toolbar-btn" title="Gérer les connexions">
          <Settings2 size={16} />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Torrent actions */}
        <button onClick={() => setAddTorrentOpen(true)} className="toolbar-btn" title="Ajouter un torrent" disabled={!activeConnectionId}>
          <FolderPlus size={16} />
        </button>
        <button
          onClick={() => handleAction(() => startTorrents(activeConnectionId!, selectedTorrentIds), 'Démarrer')}
          className="toolbar-btn" title="Démarrer" disabled={!hasSelection}
        >
          <Play size={16} />
        </button>
        <button
          onClick={() => handleAction(() => stopTorrents(activeConnectionId!, selectedTorrentIds), 'Arrêter')}
          className="toolbar-btn" title="Arrêter" disabled={!hasSelection}
        >
          <Square size={16} />
        </button>
        <button
          onClick={() => {
            if (confirm('Supprimer les torrents sélectionnés ? (Les données locales seront conservées)')) {
              handleAction(() => removeTorrents(activeConnectionId!, selectedTorrentIds, false), 'Supprimer');
            }
          }}
          className="toolbar-btn text-destructive" title="Supprimer" disabled={!hasSelection}
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={() => handleAction(() => verifyTorrents(activeConnectionId!, selectedTorrentIds), 'Vérifier')}
          className="toolbar-btn" title="Vérifier" disabled={!hasSelection}
        >
          <CheckCircle size={16} />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Global actions */}
        <button
          onClick={() => handleAction(() => startAllTorrents(activeConnectionId!), 'Tout démarrer')}
          className="toolbar-btn" title="Tout démarrer" disabled={!activeConnectionId}
        >
          <PlayCircle size={16} />
        </button>
        <button
          onClick={() => handleAction(() => stopAllTorrents(activeConnectionId!), 'Tout arrêter')}
          className="toolbar-btn" title="Tout arrêter" disabled={!activeConnectionId}
        >
          <StopCircle size={16} />
        </button>

        <div className="flex-1" />

        <button onClick={() => setOptionsOpen(true)} className="toolbar-btn" title="Options de Transmission" disabled={!activeConnectionId}>
          <Settings size={16} />
        </button>
      </div>

      <ConnectionDialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen} />
      <AddTorrentDialog open={addTorrentOpen} onOpenChange={setAddTorrentOpen} />
      <OptionsDialog open={optionsOpen} onOpenChange={setOptionsOpen} />
    </>
  );
}
