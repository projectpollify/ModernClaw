import type { ReactNode } from 'react';

export function MainContent({ children }: { children: ReactNode }) {
  return <main className="flex-1 overflow-hidden bg-background">{children}</main>;
}
