import { MessageContent } from './MessageContent';
import { useSettingsStore } from '@/stores/settingsStore';

interface StreamingBubbleProps {
  content: string;
}

export function StreamingBubble({ content }: StreamingBubbleProps) {
  const showTokenCount = useSettingsStore((state) => state.settings.showTokenCount);

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
        AI
      </div>

      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 text-secondary-foreground shadow-sm">
        <MessageContent content={content} />
        {showTokenCount ? (
          <div className="mt-2 text-xs opacity-60">~{Math.max(1, Math.ceil(content.length / 4))} tokens</div>
        ) : null}
        <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-foreground/50 align-middle" />
      </div>
    </div>
  );
}
