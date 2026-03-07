import { useSession } from '@/hooks/useSession';
import { useSessionStats } from '@/hooks/useStats';
import { useFreeSpace } from '@/hooks/useStats';
import { useAppStore } from '@/stores/app-store';
import { formatSpeed, formatBytes } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchConnections } from '@/api/connections';
import { ArrowDown, ArrowUp, HardDrive } from 'lucide-react';

export function StatusBar() {
  const connectionId = useAppStore((s) => s.activeConnectionId);
  const { data: connections = [] } = useQuery({ queryKey: ['connections'], queryFn: fetchConnections });
  const { data: session } = useSession();
  const { data: stats } = useSessionStats();
  const { data: freeSpace } = useFreeSpace();

  const conn = connections.find((c) => c.id === connectionId);

  return (
    <footer className="flex items-center gap-4 px-3 py-1 border-t border-border bg-muted/30 text-xs text-muted-foreground">
      <span className="truncate">
        {session
          ? `Transmission ${session.version} sur ${conn?.host}:${conn?.port}`
          : 'Non connecté'}
      </span>
      <div className="flex-1" />
      {stats && (
        <>
          <span className="flex items-center gap-1">
            <ArrowDown size={12} className="text-blue-500" />
            {formatSpeed(stats.downloadSpeed)}
          </span>
          <span className="flex items-center gap-1">
            <ArrowUp size={12} className="text-green-500" />
            {formatSpeed(stats.uploadSpeed)}
          </span>
        </>
      )}
      {freeSpace && (
        <span className="flex items-center gap-1">
          <HardDrive size={12} />
          Libre: {formatBytes(freeSpace['size-bytes'])}
        </span>
      )}
    </footer>
  );
}
