import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { setTorrent } from '@/api/transmission';
import { useAppStore } from '@/stores/app-store';
import { formatBytes, cn } from '@/lib/utils';
import type { Torrent } from '@/types/transmission';

interface Props {
  torrent: Torrent;
}

export function FilesTab({ torrent }: Props) {
  const connectionId = useAppStore((s) => s.activeConnectionId);
  const queryClient = useQueryClient();
  const files = torrent.files || [];
  const stats = torrent.fileStats || [];

  if (files.length === 0) {
    return <div className="text-muted-foreground">Aucun fichier</div>;
  }

  const toggleWanted = async (index: number, wanted: boolean) => {
    if (!connectionId) return;
    try {
      await setTorrent(connectionId, [torrent.id], {
        [wanted ? 'files-wanted' : 'files-unwanted']: [index],
      });
      queryClient.invalidateQueries({ queryKey: ['torrent-detail'] });
    } catch (err) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnu'}`);
    }
  };

  const setPriority = async (index: number, priority: number) => {
    if (!connectionId) return;
    const key = priority === 1 ? 'priority-high' : priority === -1 ? 'priority-low' : 'priority-normal';
    try {
      await setTorrent(connectionId, [torrent.id], { [key]: [index] });
      queryClient.invalidateQueries({ queryKey: ['torrent-detail'] });
    } catch (err) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnu'}`);
    }
  };

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-1 px-2 w-8">DL</th>
          <th className="py-1 px-2">Nom</th>
          <th className="py-1 px-2 w-20">Taille</th>
          <th className="py-1 px-2 w-20">Fait</th>
          <th className="py-1 px-2 w-16">%</th>
          <th className="py-1 px-2 w-24">Priorité</th>
        </tr>
      </thead>
      <tbody>
        {files.map((f, i) => {
          const s = stats[i];
          const pct = f.length > 0 ? (f.bytesCompleted / f.length) * 100 : 100;
          return (
            <tr key={i} className="border-b border-border/50 hover:bg-accent/30">
              <td className="py-0.5 px-2">
                <input
                  type="checkbox"
                  checked={s?.wanted !== false}
                  onChange={(e) => toggleWanted(i, e.target.checked)}
                  className="cursor-pointer"
                />
              </td>
              <td className="py-0.5 px-2 truncate max-w-[400px]" title={f.name}>{f.name}</td>
              <td className="py-0.5 px-2">{formatBytes(f.length)}</td>
              <td className="py-0.5 px-2">{formatBytes(f.bytesCompleted)}</td>
              <td className="py-0.5 px-2">
                <span className={cn(pct >= 100 && 'text-green-600')}>{pct.toFixed(1)}%</span>
              </td>
              <td className="py-0.5 px-2">
                <select
                  value={s?.priority ?? 0}
                  onChange={(e) => setPriority(i, Number(e.target.value))}
                  className="text-xs bg-transparent border border-border rounded px-1 py-0.5"
                >
                  <option value={1}>Haute</option>
                  <option value={0}>Normale</option>
                  <option value={-1}>Basse</option>
                </select>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
