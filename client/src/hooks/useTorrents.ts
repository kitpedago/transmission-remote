import { useQuery } from '@tanstack/react-query';
import { getTorrents } from '@/api/transmission';
import { LIST_FIELDS, DETAIL_FIELDS } from '@/lib/transmission-fields';
import { useAppStore } from '@/stores/app-store';
import type { Torrent } from '@/types/transmission';

export function useTorrents() {
  const connectionId = useAppStore((s) => s.activeConnectionId);

  return useQuery<Torrent[]>({
    queryKey: ['torrents', connectionId],
    queryFn: async () => {
      if (!connectionId) return [];
      const data = await getTorrents(connectionId, LIST_FIELDS);
      return data.torrents as Torrent[];
    },
    enabled: !!connectionId,
    refetchInterval: 3000,
  });
}

export function useTorrentDetails(torrentId: number | null) {
  const connectionId = useAppStore((s) => s.activeConnectionId);

  return useQuery<Torrent | null>({
    queryKey: ['torrent-detail', connectionId, torrentId],
    queryFn: async () => {
      if (!connectionId || !torrentId) return null;
      const data = await getTorrents(connectionId, DETAIL_FIELDS, [torrentId]);
      return (data.torrents as Torrent[])[0] ?? null;
    },
    enabled: !!connectionId && !!torrentId,
    refetchInterval: 3000,
  });
}
