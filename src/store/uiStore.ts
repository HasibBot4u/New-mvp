import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  locale: 'bn' | 'en';
  sidebarOpen: boolean;
  unreadNotifications: number;
  toggleTheme: () => void;
  setLocale: (locale: 'bn' | 'en') => void;
  setSidebarOpen: (open: boolean) => void;
  setUnreadCount: (count: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'bn',
      sidebarOpen: false,
      unreadNotifications: 0,
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        }),
      setLocale: (locale) => set({ locale }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setUnreadCount: (count) => set({ unreadNotifications: count }),
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
