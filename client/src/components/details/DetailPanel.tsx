import { useState } from 'react';
import { useTorrentDetails } from '@/hooks/useTorrents';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import { GeneralTab } from './GeneralTab';
import { TrackersTab } from './TrackersTab';
import { PeersTab } from './PeersTab';
import { FilesTab } from './FilesTab';
import { StatsTab } from './StatsTab';

const tabs = [
  { id: 'general', label: 'Général' },
  { id: 'trackers', label: 'Trackers' },
  { id: 'peers', label: 'Pairs' },
  { id: 'files', label: 'Fichiers' },
  { id: 'stats', label: 'Statistiques' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function DetailPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const { selectedTorrentIds, detailPanelOpen } = useAppStore();
  const torrentId = selectedTorrentIds.length === 1 ? selectedTorrentIds[0] : null;
  const { data: torrent } = useTorrentDetails(torrentId);

  if (!detailPanelOpen) return null;

  return (
    <div className="border-t border-border h-[280px] flex flex-col shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-3 text-[13px]">
        {!torrent ? (
          <div className="text-muted-foreground text-center py-8">
            {selectedTorrentIds.length > 1
              ? `${selectedTorrentIds.length} torrents sélectionnés`
              : 'Sélectionnez un torrent pour voir les détails'}
          </div>
        ) : (
          <>
            {activeTab === 'general' && <GeneralTab torrent={torrent} />}
            {activeTab === 'trackers' && <TrackersTab torrent={torrent} />}
            {activeTab === 'peers' && <PeersTab torrent={torrent} />}
            {activeTab === 'files' && <FilesTab torrent={torrent} />}
            {activeTab === 'stats' && <StatsTab />}
          </>
        )}
      </div>
    </div>
  );
}
