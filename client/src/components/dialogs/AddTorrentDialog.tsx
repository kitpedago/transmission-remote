import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addTorrent, rpc } from '@/api/transmission';
import { useAppStore } from '@/stores/app-store';
import { useSession } from '@/hooks/useSession';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTorrentDialog({ open, onOpenChange }: Props) {
  const connectionId = useAppStore((s) => s.activeConnectionId);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [downloadDir, setDownloadDir] = useState('');
  const [paused, setPaused] = useState(false);
  const [startNow, setStartNow] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!connectionId || !url.trim()) return;
    try {
      let result;
      // Check if it's a file or a URL/magnet
      if (url.startsWith('data:') || url.includes(';base64,')) {
        const base64 = url.split(',')[1];
        result = await addTorrent(connectionId, {
          metainfo: base64,
          'download-dir': downloadDir || undefined,
          paused,
        });
      } else {
        result = await addTorrent(connectionId, {
          filename: url.trim(),
          'download-dir': downloadDir || undefined,
          paused,
        });
      }
      // Start immediately (bypass queue) if option is checked
      if (startNow && !paused) {
        const added = result?.['torrent-added'] || result?.['torrent-duplicate'];
        if (added?.id) {
          await rpc(connectionId, 'torrent-start-now', { ids: [added.id] });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['torrents'] });
      toast.success(startNow && !paused ? 'Torrent ajouté et démarré immédiatement' : 'Torrent ajouté');
      setUrl('');
      onOpenChange(false);
    } catch (err) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnu'}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUrl(result); // data:... URL with base64
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-background rounded-lg shadow-xl w-[480px]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Ajouter un torrent</h2>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm block mb-1">URL, lien magnet ou fichier .torrent:</label>
            <input
              value={url.startsWith('data:') ? '(fichier sélectionné)' : url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="magnet:?xt=urn:btih:... ou https://..."
              className="w-full h-8 px-2 border border-border rounded bg-background text-sm"
            />
          </div>
          <div>
            <input type="file" accept=".torrent" onChange={handleFileSelect} className="text-sm" />
          </div>
          <div>
            <label className="text-sm block mb-1">Dossier de téléchargement:</label>
            <input
              value={downloadDir}
              onChange={(e) => setDownloadDir(e.target.value)}
              placeholder={session?.['download-dir'] || '/home/user'}
              className="w-full h-8 px-2 border border-border rounded bg-background text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
            Ajouter en pause
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} disabled={paused} />
            <span className={paused ? 'text-muted-foreground' : ''}>Démarrer immédiatement (ignorer la file d'attente)</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={handleSubmit} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Ajouter</button>
          <button onClick={() => onOpenChange(false)} className="px-4 py-1.5 text-sm border border-border rounded hover:bg-accent">Annuler</button>
        </div>
      </div>
    </div>
  );
}
