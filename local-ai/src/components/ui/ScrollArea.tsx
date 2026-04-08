import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div className={cn('overflow-y-auto overflow-x-hidden', className)} {...props}>
      {children}
    </div>
  );
}
