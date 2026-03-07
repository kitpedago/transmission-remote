import type { Torrent } from '@/types/transmission';

interface Props {
  torrent: Torrent;
}

function dateStr(ts: number) {
  if (!ts || ts === 0) return '-';
  return new Date(ts * 1000).toLocaleString('fr-FR');
}

export function TrackersTab({ torrent }: Props) {
  const trackers = torrent.trackerStats || [];

  if (trackers.length === 0) {
    return <div className="text-muted-foreground">Aucun tracker</div>;
  }

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-1 px-2">Tier</th>
          <th className="py-1 px-2">Tracker</th>
          <th className="py-1 px-2">Dernière annonce</th>
          <th className="py-1 px-2">Pairs</th>
          <th className="py-1 px-2">Seeds</th>
          <th className="py-1 px-2">Leechers</th>
          <th className="py-1 px-2">Prochaine annonce</th>
        </tr>
      </thead>
      <tbody>
        {trackers.map((t) => (
          <tr key={t.id} className="border-b border-border/50 hover:bg-accent/30">
            <td className="py-0.5 px-2">{t.tier}</td>
            <td className="py-0.5 px-2">{t.host || new URL(t.announce).hostname}</td>
            <td className="py-0.5 px-2">{t.lastAnnounceResult || '-'} ({dateStr(t.lastAnnounceTime)})</td>
            <td className="py-0.5 px-2">{t.lastAnnouncePeerCount}</td>
            <td className="py-0.5 px-2">{t.seederCount >= 0 ? t.seederCount : '-'}</td>
            <td className="py-0.5 px-2">{t.leecherCount >= 0 ? t.leecherCount : '-'}</td>
            <td className="py-0.5 px-2">{dateStr(t.nextAnnounceTime)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
