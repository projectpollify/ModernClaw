import { MessageMetricsRow } from './MessageMetricsRow';
import { MessageContent } from './MessageContent';
import { ThinkingPulse } from './ThinkingPulse';
import { useSettingsStore } from '@/stores/settingsStore';
import type { MessageMetrics } from '@/types';

interface StreamingBubbleProps {
  content: string;
  metrics?: MessageMetrics | null;
}

export function StreamingBubble({ content, metrics }: StreamingBubbleProps) {
  const { showTokenCount, showResponseMetrics } = useSettingsStore((state) => state.settings);
  const hasVisibleContent = Boolean(content.trim());

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
        AI
      </div>

      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 text-secondary-foreground shadow-sm">
        {hasVisibleContent ? (
          <MessageContent content={content} />
        ) : (
          <div className="flex items-center gap-3">
            <ThinkingPulse />
            <div>
              <p className="text-sm font-medium text-secondary-foreground/90">Thinking</p>
              <p className="text-xs text-secondary-foreground/60">ModernClaw is working through your reply.</p>
            </div>
          </div>
        )}
        {showResponseMetrics ? <MessageMetricsRow metrics={metrics} /> : null}
        {showTokenCount && hasVisibleContent ? (
          <div className="mt-2 text-xs opacity-60">~{Math.max(1, Math.ceil(content.length / 4))} tokens</div>
        ) : null}
        {hasVisibleContent ? <ThinkingPulse compact className="ml-2 inline-flex align-middle" /> : null}
      </div>
    </div>
  );
}
