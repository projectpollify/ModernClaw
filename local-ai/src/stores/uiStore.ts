import { create } from 'zustand';
import type { ViewType } from '@/types';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

interface ViewState {
  activeView: ViewType;
  setView: (view: ViewType) => void;
}

export const useViewStore = create<ViewState>()((set) => ({
  activeView: 'chat',
  setView: (view) => set({ activeView: view }),
}));
