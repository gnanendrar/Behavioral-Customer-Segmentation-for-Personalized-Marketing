import { create } from 'zustand';

type PipelineStatus = 'idle' | 'running' | 'completed';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  pipelineStatus: PipelineStatus;
  setPipelineStatus: (status: PipelineStatus) => void;
  notificationCount: number;
  setNotificationCount: (n: number) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  lastUpdated: string | null;
  setLastUpdated: (date: string) => void;
  customers: any[];
  setCustomers: (customers: any[]) => void;
  segments: any[];
  setSegments: (segments: any[]) => void;
}

const THEME_KEY = 'behavioriq-theme';

const initialDark = (() => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
  } catch { /* storage unavailable */ }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
})();

export const applyTheme = (dark: boolean) => {
  document.documentElement.classList.toggle('dark', dark);
};
applyTheme(initialDark);

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  pipelineStatus: 'idle',
  setPipelineStatus: (status) => set({ pipelineStatus: status }),
  notificationCount: 0,
  setNotificationCount: (n) => set({ notificationCount: n }),
  darkMode: initialDark,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch { /* ignore */ }
      return { darkMode: next };
    }),
  lastUpdated: null,
  setLastUpdated: (date) => set({ lastUpdated: date }),
  customers: [],
  setCustomers: (customers) => set({ customers }),
  segments: [],
  setSegments: (segments) => set({ segments }),
}));

export default useAppStore;
