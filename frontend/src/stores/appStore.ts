import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  pipelineStatus: 'idle' | 'running' | 'completed';
  setPipelineStatus: (status: 'idle' | 'running' | 'completed') => void;
  notificationCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
  lastUpdated: string | null;
  setLastUpdated: (date: string) => void;
  customers: any[];
  setCustomers: (customers: any[]) => void;
  segments: any[];
  setSegments: (segments: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  pipelineStatus: 'idle',
  setPipelineStatus: (status) => set({ pipelineStatus: status }),
  notificationCount: 3,
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  lastUpdated: null,
  setLastUpdated: (date) => set({ lastUpdated: date }),
  customers: [],
  setCustomers: (customers) => set({ customers }),
  segments: [],
  setSegments: (segments) => set({ segments }),
}));

export default useAppStore;
