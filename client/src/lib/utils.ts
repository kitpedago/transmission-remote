import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '0 Ko/s';
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number): string {
  if (seconds < 0) return '∞';
  if (seconds === 0) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatRatio(ratio: number): string {
  if (ratio < 0) return '∞';
  return ratio.toFixed(3);
}

export function formatDate(timestamp: number): string {
  if (timestamp === 0) return '-';
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Transmission torrent status codes
export const TORRENT_STATUS = {
  STOPPED: 0,
  CHECK_WAIT: 1,
  CHECK: 2,
  DOWNLOAD_WAIT: 3,
  DOWNLOAD: 4,
  SEED_WAIT: 5,
  SEED: 6,
} as const;

export function getStatusText(status: number): string {
  switch (status) {
    case TORRENT_STATUS.STOPPED: return 'Arrêté';
    case TORRENT_STATUS.CHECK_WAIT: return 'En attente de vérification';
    case TORRENT_STATUS.CHECK: return 'Vérification';
    case TORRENT_STATUS.DOWNLOAD_WAIT: return 'En attente';
    case TORRENT_STATUS.DOWNLOAD: return 'Téléchargement';
    case TORRENT_STATUS.SEED_WAIT: return 'En attente d\'envoi';
    case TORRENT_STATUS.SEED: return 'Envoi';
    default: return 'Inconnu';
  }
}

export function getStatusLabel(status: number, percentDone: number, error: number): string {
  if (error > 0) return 'Erreur';
  if (percentDone >= 1) return 'Terminé';
  return getStatusText(status);
}
