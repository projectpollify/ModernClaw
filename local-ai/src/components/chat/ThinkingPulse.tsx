import { cn } from '@/lib/utils';

interface ThinkingPulseProps {
  compact?: boolean;
  className?: string;
}

export function ThinkingPulse({ compact = false, className }: ThinkingPulseProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('mc-thinking-pulse', compact && 'mc-thinking-pulse--compact', className)}
    >
      <span className="mc-thinking-pulse__ring" />
      <span className="mc-thinking-pulse__core" />
      <span className="mc-thinking-pulse__orbit mc-thinking-pulse__orbit--1" />
      <span className="mc-thinking-pulse__orbit mc-thinking-pulse__orbit--2" />
      <span className="mc-thinking-pulse__orbit mc-thinking-pulse__orbit--3" />
    </span>
  );
}
