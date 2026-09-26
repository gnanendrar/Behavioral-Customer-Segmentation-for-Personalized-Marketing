import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  pipelineStatus: 'idle' | 'running' | 'completed';
  setPipelineStatus: (status: 'idle' | 'running' | 'completed') => void;
  notificationCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  pipelineStatus: 'idle',
  setPipelineStatus: (status) => set({ pipelineStatus: status }),
  notificationCount: 3,
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
