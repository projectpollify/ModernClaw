import { ThinkingPulse } from './ThinkingPulse';

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
        AI
      </div>

      <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
        <div className="flex items-center gap-3">
          <ThinkingPulse />
          <div>
            <p className="text-sm font-medium text-secondary-foreground/90">Thinking</p>
            <p className="text-xs text-secondary-foreground/60">Preparing a response.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
