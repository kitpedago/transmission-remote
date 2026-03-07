import type { Torrent } from '@/types/transmission';
import { formatSpeed } from '@/lib/utils';

interface Props {
  torrent: Torrent;
}

export function PeersTab({ torrent }: Props) {
  const peers = torrent.peers || [];

  if (peers.length === 0) {
    return <div className="text-muted-foreground">Aucun pair connecté</div>;
  }

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-1 px-2">Adresse</th>
          <th className="py-1 px-2">Port</th>
          <th className="py-1 px-2">Client</th>
          <th className="py-1 px-2">Flags</th>
          <th className="py-1 px-2">Progression</th>
          <th className="py-1 px-2">Réception</th>
          <th className="py-1 px-2">Envoi</th>
        </tr>
      </thead>
      <tbody>
        {peers.map((p, i) => (
          <tr key={`${p.address}-${i}`} className="border-b border-border/50 hover:bg-accent/30">
            <td className="py-0.5 px-2">{p.address}</td>
            <td className="py-0.5 px-2">{p.port}</td>
            <td className="py-0.5 px-2 truncate max-w-[200px]">{p.clientName}</td>
            <td className="py-0.5 px-2 font-mono">{p.flagStr}</td>
            <td className="py-0.5 px-2">{(p.progress * 100).toFixed(1)}%</td>
            <td className="py-0.5 px-2">{p.rateToClient > 0 ? formatSpeed(p.rateToClient) : '-'}</td>
            <td className="py-0.5 px-2">{p.rateToPeer > 0 ? formatSpeed(p.rateToPeer) : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
