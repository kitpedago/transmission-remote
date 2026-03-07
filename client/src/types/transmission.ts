export interface Torrent {
  id: number;
  name: string;
  status: number;
  totalSize: number;
  percentDone: number;
  rateDownload: number;
  rateUpload: number;
  eta: number;
  uploadRatio: number;
  addedDate: number;
  error: number;
  errorString: string;
  downloadDir: string;
  peersConnected: number;
  peersSendingToUs: number;
  peersGettingFromUs: number;
  sizeWhenDone: number;
  haveValid: number;
  uploadedEver: number;
  downloadedEver: number;
  activityDate: number;
  doneDate: number;
  queuePosition: number;
  isFinished: boolean;
  trackerStats: TrackerStat[];
  // Detail fields
  hashString?: string;
  magnetLink?: string;
  creator?: string;
  comment?: string;
  dateCreated?: number;
  startDate?: number;
  pieceCount?: number;
  pieceSize?: number;
  files?: TorrentFile[];
  fileStats?: FileStats[];
  peers?: Peer[];
  trackers?: Tracker[];
  leftUntilDone?: number;
  desiredAvailable?: number;
  corruptEver?: number;
  secondsDownloading?: number;
  secondsSeeding?: number;
  bandwidthPriority?: number;
  downloadLimit?: number;
  downloadLimited?: boolean;
  uploadLimit?: number;
  uploadLimited?: boolean;
  honorsSessionLimits?: boolean;
  seedIdleLimit?: number;
  seedIdleMode?: number;
  seedRatioLimit?: number;
  seedRatioMode?: number;
  labels?: string[];
  metadataPercentComplete?: number;
}

export interface TrackerStat {
  id: number;
  host: string;
  announce: string;
  announceState: number;
  downloadCount: number;
  hasAnnounced: boolean;
  hasScraped: boolean;
  lastAnnouncePeerCount: number;
  lastAnnounceResult: string;
  lastAnnounceTime: number;
  lastScrapeResult: string;
  lastScrapeTime: number;
  leecherCount: number;
  nextAnnounceTime: number;
  nextScrapeTime: number;
  seederCount: number;
  tier: number;
}

export interface Tracker {
  id: number;
  announce: string;
  scrape: string;
  tier: number;
}

export interface TorrentFile {
  name: string;
  length: number;
  bytesCompleted: number;
}

export interface FileStats {
  wanted: boolean;
  priority: number;
  bytesCompleted: number;
}

export interface Peer {
  address: string;
  clientName: string;
  flagStr: string;
  isDownloadingFrom: boolean;
  isEncrypted: boolean;
  isUploadingTo: boolean;
  port: number;
  progress: number;
  rateToClient: number;
  rateToPeer: number;
}

export interface SessionStats {
  activeTorrentCount: number;
  downloadSpeed: number;
  uploadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
  'cumulative-stats': {
    downloadedBytes: number;
    filesAdded: number;
    secondsActive: number;
    sessionCount: number;
    uploadedBytes: number;
  };
  'current-stats': {
    downloadedBytes: number;
    filesAdded: number;
    secondsActive: number;
    sessionCount: number;
    uploadedBytes: number;
  };
}

export interface Session {
  version: string;
  'rpc-version': number;
  'download-dir': string;
  'incomplete-dir': string;
  'incomplete-dir-enabled': boolean;
  'rename-partial-files': boolean;
  'speed-limit-down': number;
  'speed-limit-down-enabled': boolean;
  'speed-limit-up': number;
  'speed-limit-up-enabled': boolean;
  'alt-speed-down': number;
  'alt-speed-up': number;
  'alt-speed-enabled': boolean;
  'alt-speed-time-enabled': boolean;
  'alt-speed-time-begin': number;
  'alt-speed-time-end': number;
  'alt-speed-time-day': number;
  'peer-limit-global': number;
  'peer-limit-per-torrent': number;
  'peer-port': number;
  'peer-port-random-on-start': boolean;
  'port-forwarding-enabled': boolean;
  'download-queue-enabled': boolean;
  'download-queue-size': number;
  'seed-queue-enabled': boolean;
  'seed-queue-size': number;
  'seedRatioLimit': number;
  'seedRatioLimited': boolean;
  'idle-seeding-limit': number;
  'idle-seeding-limit-enabled': boolean;
  'cache-size-mb': number;
  encryption: string;
  'dht-enabled': boolean;
  'lpd-enabled': boolean;
  'pex-enabled': boolean;
  'utp-enabled': boolean;
}

export interface Connection {
  id: number;
  name: string;
  host: string;
  port: number;
  ssl: boolean;
  username: string;
  password: string;
  rpc_path: string;
  auto_reconnect: boolean;
}

export interface FreeSpace {
  path: string;
  'size-bytes': number;
  total_size: number;
}
