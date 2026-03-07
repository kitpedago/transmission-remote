import type { Torrent } from '@/types/transmission';
import { formatBytes, formatSpeed, formatRatio, getStatusText } from '@/lib/utils';

interface Props {
  torrent: Torrent;
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-[160px] shrink-0">{label}:</span>
      <span className="truncate">{value ?? '-'}</span>
    </div>
  );
}

function dateStr(ts?: number) {
  if (!ts || ts === 0) return '-';
  return new Date(ts * 1000).toLocaleString('fr-FR');
}

export function GeneralTab({ torrent }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
      <div className="space-y-0.5">
        <h3 className="font-semibold mb-1">Transfert</h3>
        <InfoRow label="Statut" value={getStatusText(torrent.status)} />
        <InfoRow label="Téléchargé" value={formatBytes(torrent.downloadedEver || 0)} />
        <InfoRow label="Envoyé" value={formatBytes(torrent.uploadedEver || 0)} />
        <InfoRow label="Vitesse de téléchargement" value={`${formatSpeed(torrent.rateDownload)} (moyenne: ${formatSpeed(torrent.downloadedEver && torrent.secondsDownloading ? torrent.downloadedEver / torrent.secondsDownloading : 0)})`} />
        <InfoRow label="Vitesse d'envoi" value={formatSpeed(torrent.rateUpload)} />
        {torrent.error > 0 && <InfoRow label="Erreur" value={torrent.errorString} />}
        <InfoRow label="Ratio de partage" value={formatRatio(torrent.uploadRatio)} />
        <InfoRow label="Sources" value={`${torrent.peersSendingToUs} connecté`} />
        <InfoRow label="Pairs" value={String(torrent.peersConnected)} />
        {torrent.trackerStats?.[0] && (
          <InfoRow label="Tracker" value={new URL(torrent.trackerStats[0].announce).hostname} />
        )}
      </div>
      <div className="space-y-0.5">
        <h3 className="font-semibold mb-1">Torrent</h3>
        <InfoRow label="Nom" value={torrent.name} />
        <InfoRow label="Taille totale" value={formatBytes(torrent.totalSize)} />
        {torrent.hashString && <InfoRow label="Hachage" value={torrent.hashString} />}
        <InfoRow label="Ajouté le" value={dateStr(torrent.addedDate)} />
        {torrent.doneDate > 0 && <InfoRow label="Terminé le" value={dateStr(torrent.doneDate)} />}
        {torrent.dateCreated && <InfoRow label="Créé le" value={dateStr(torrent.dateCreated)} />}
        {torrent.creator && <InfoRow label="Créé par" value={torrent.creator} />}
        {torrent.comment && <InfoRow label="Commentaire" value={torrent.comment} />}
        <InfoRow label="Dossier" value={torrent.downloadDir} />
        {torrent.pieceCount && (
          <InfoRow label="Parts" value={`${torrent.pieceCount} x ${formatBytes(torrent.pieceSize || 0)}`} />
        )}
        {torrent.magnetLink && (
          <InfoRow label="Magnet Link" value={torrent.magnetLink.substring(0, 80) + '...'} />
        )}
      </div>
    </div>
  );
}
