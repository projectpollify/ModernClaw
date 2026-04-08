import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import type { Message } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVoiceStore } from '@/stores/voiceStore';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const { showTokenCount, enableVoiceOutput } = useSettingsStore((state) => state.settings);
  const { speakMessage, isSpeaking, isPaused, speakingMessageId } = useVoiceStore();
  const tokenCount = estimateTokens(message.content);
  const isActiveMessage = speakingMessageId === message.id;

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-secondary text-secondary-foreground'
        )}
      >
        <MessageContent content={message.content} />
        <div
          className={cn(
            'mt-2 flex items-center gap-2 text-xs opacity-60',
            isUser ? 'justify-end text-right' : 'justify-start text-left'
          )}
        >
          <span>
            {formatTime(message.createdAt)}
            {showTokenCount ? ` | ~${tokenCount} tokens` : ''}
          </span>
          {!isUser && enableVoiceOutput ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px] opacity-90"
              onClick={() => void speakMessage(message.id, message.content)}
            >
              {isActiveMessage
                ? isPaused
                  ? 'Resume Reading'
                  : 'Pause Reading'
                : isSpeaking
                  ? 'Read Instead'
                  : 'Read Aloud'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function estimateTokens(content: string) {
  return Math.max(1, Math.ceil(content.length / 4));
}
