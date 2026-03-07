import { useQuery } from '@tanstack/react-query';
import { getSessionStats, getFreeSpace } from '@/api/transmission';
import { useAppStore } from '@/stores/app-store';
import { useSession } from './useSession';
import type { SessionStats, FreeSpace } from '@/types/transmission';

export function useSessionStats() {
  const connectionId = useAppStore((s) => s.activeConnectionId);

  return useQuery<SessionStats | null>({
    queryKey: ['session-stats', connectionId],
    queryFn: async () => {
      if (!connectionId) return null;
      return getSessionStats(connectionId) as Promise<SessionStats>;
    },
    enabled: !!connectionId,
    refetchInterval: 5000,
  });
}

export function useFreeSpace() {
  const connectionId = useAppStore((s) => s.activeConnectionId);
  const { data: session } = useSession();

  return useQuery<FreeSpace | null>({
    queryKey: ['free-space', connectionId, session?.['download-dir']],
    queryFn: async () => {
      if (!connectionId || !session?.['download-dir']) return null;
      return getFreeSpace(connectionId, session['download-dir']) as Promise<FreeSpace>;
    },
    enabled: !!connectionId && !!session?.['download-dir'],
    refetchInterval: 30000,
  });
}
