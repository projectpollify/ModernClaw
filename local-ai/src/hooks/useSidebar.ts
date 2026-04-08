import { useSidebarStore } from '@/stores/uiStore';

export function useSidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const toggle = useSidebarStore((state) => state.toggle);
  const open = useSidebarStore((state) => state.open);
  const close = useSidebarStore((state) => state.close);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}
