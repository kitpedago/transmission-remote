import { useSessionStats } from '@/hooks/useStats';
import { formatBytes } from '@/lib/utils';

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatBlock({ title, stats }: { title: string; stats: { downloadedBytes: number; uploadedBytes: number; filesAdded: number; secondsActive: number; sessionCount: number } }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-0.5">
        <div className="flex gap-2">
          <span className="text-muted-foreground min-w-[140px]">Téléchargé:</span>
          <span>{formatBytes(stats.downloadedBytes)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground min-w-[140px]">Envoyé:</span>
          <span>{formatBytes(stats.uploadedBytes)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground min-w-[140px]">Ratio:</span>
          <span>{stats.downloadedBytes > 0 ? (stats.uploadedBytes / stats.downloadedBytes).toFixed(3) : '-'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground min-w-[140px]">Fichiers ajoutés:</span>
          <span>{stats.filesAdded}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground min-w-[140px]">Temps actif:</span>
          <span>{formatDuration(stats.secondsActive)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground min-w-[140px]">Sessions:</span>
          <span>{stats.sessionCount}</span>
        </div>
      </div>
    </div>
  );
}

export function StatsTab() {
  const { data: stats } = useSessionStats();

  if (!stats) return <div className="text-muted-foreground">Chargement...</div>;

  return (
    <div className="grid grid-cols-2 gap-8">
      <StatBlock title="Session courante" stats={stats['current-stats']} />
      <StatBlock title="Statistiques cumulées" stats={stats['cumulative-stats']} />
    </div>
  );
}
