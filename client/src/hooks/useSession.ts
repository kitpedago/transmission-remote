import { useQuery } from '@tanstack/react-query';
import { getSession } from '@/api/transmission';
import { useAppStore } from '@/stores/app-store';
import type { Session } from '@/types/transmission';

export function useSession() {
  const connectionId = useAppStore((s) => s.activeConnectionId);

  return useQuery<Session | null>({
    queryKey: ['session', connectionId],
    queryFn: async () => {
      if (!connectionId) return null;
      return getSession(connectionId) as Promise<Session>;
    },
    enabled: !!connectionId,
    refetchInterval: 30000,
  });
}
