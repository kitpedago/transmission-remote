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
  sidebarFilter: SidebarFilter;
  detailPanelOpen: boolean;

  setActiveConnection: (id: number | null) => void;
  setSelectedTorrentIds: (ids: number[]) => void;
  toggleTorrentSelection: (id: number, multi: boolean) => void;
  setSidebarFilter: (filter: SidebarFilter) => void;
  setDetailPanelOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeConnectionId: null,
  selectedTorrentIds: [],
  sidebarFilter: 'all',
  detailPanelOpen: true,

  setActiveConnection: (id) => set({ activeConnectionId: id, selectedTorrentIds: [] }),
  setSelectedTorrentIds: (ids) => set({ selectedTorrentIds: ids }),
  toggleTorrentSelection: (id, multi) => {
    const current = get().selectedTorrentIds;
    if (multi) {
      set({ selectedTorrentIds: current.includes(id) ? current.filter((i) => i !== id) : [...current, id] });
    } else {
      set({ selectedTorrentIds: [id] });
    }
  },
  setSidebarFilter: (filter) => set({ sidebarFilter: filter }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
}));
