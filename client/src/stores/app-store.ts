import { create } from 'zustand';

export type SidebarFilter =
  | 'all'
  | 'downloading'
  | 'completed'
  | 'active'
  | 'inactive'
  | 'stopped'
  | 'error'
  | 'queued';

interface AppState {
  activeConnectionId: number | null;
  selectedTorrentIds: number[];
  lastClickedTorrentId: number | null;
  sidebarFilter: SidebarFilter;
  detailPanelOpen: boolean;

  setActiveConnection: (id: number | null) => void;
  setSelectedTorrentIds: (ids: number[]) => void;
  toggleTorrentSelection: (id: number, multi: boolean, shift?: boolean, visibleIds?: number[]) => void;
  setSidebarFilter: (filter: SidebarFilter) => void;
  setDetailPanelOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeConnectionId: null,
  selectedTorrentIds: [],
  lastClickedTorrentId: null,
  sidebarFilter: 'all',
  detailPanelOpen: true,

  setActiveConnection: (id) => set({ activeConnectionId: id, selectedTorrentIds: [], lastClickedTorrentId: null }),
  setSelectedTorrentIds: (ids) => set({ selectedTorrentIds: ids }),
  toggleTorrentSelection: (id, multi, shift, visibleIds) => {
    const current = get().selectedTorrentIds;
    if (shift && visibleIds) {
      const lastClicked = get().lastClickedTorrentId;
      if (lastClicked !== null) {
        const lastIdx = visibleIds.indexOf(lastClicked);
        const curIdx = visibleIds.indexOf(id);
        if (lastIdx !== -1 && curIdx !== -1) {
          const start = Math.min(lastIdx, curIdx);
          const end = Math.max(lastIdx, curIdx);
          const rangeIds = visibleIds.slice(start, end + 1);
          if (multi) {
            const merged = new Set([...current, ...rangeIds]);
            set({ selectedTorrentIds: [...merged], lastClickedTorrentId: id });
          } else {
            set({ selectedTorrentIds: rangeIds, lastClickedTorrentId: id });
          }
          return;
        }
      }
    }
    if (multi) {
      set({
        selectedTorrentIds: current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
        lastClickedTorrentId: id,
      });
    } else {
      set({ selectedTorrentIds: [id], lastClickedTorrentId: id });
    }
  },
  setSidebarFilter: (filter) => set({ sidebarFilter: filter }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
}));
