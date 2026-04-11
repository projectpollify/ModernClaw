import { convertFileSrc } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import type { Message } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useChatStore } from '@/stores/chatStore';
import { useVoiceStore } from '@/stores/voiceStore';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const setMessageFeedback = useChatStore((state) => state.setMessageFeedback);
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
        {message.attachments?.some((attachment) => attachment.kind === 'image') ? (
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {message.attachments
              .filter((attachment) => attachment.kind === 'image')
              .map((attachment) => (
                <a
                  key={attachment.id}
                  href={convertFileSrc(attachment.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-xl border border-black/10 bg-black/5"
                >
                  <img
                    src={convertFileSrc(attachment.path)}
                    alt={attachment.name}
                    className="max-h-72 w-full object-cover"
                  />
                </a>
              ))}
          </div>
        ) : null}
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
          {isAssistant ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Mark response helpful"
                title="Helpful"
                onClick={() => void setMessageFeedback(message.id, message.feedback === 'up' ? undefined : 'up')}
                className={cn(
                  'rounded-md px-1.5 py-1 transition-colors',
                  message.feedback === 'up'
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : 'hover:bg-background/50'
                )}
              >
                <ThumbUpIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Mark response not useful"
                title="Not useful"
                onClick={() => void setMessageFeedback(message.id, message.feedback === 'down' ? undefined : 'down')}
                className={cn(
                  'rounded-md px-1.5 py-1 transition-colors',
                  message.feedback === 'down'
                    ? 'bg-rose-500/15 text-rose-700'
                    : 'hover:bg-background/50'
                )}
              >
                <ThumbDownIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
          {isAssistant && enableVoiceOutput ? (
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

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 9V5a3 3 0 00-3-3l-1 4-3 4v10h11.28a2 2 0 001.96-1.61l1.39-7A2 2 0 0019.67 9H14zM7 22H4a1 1 0 01-1-1v-9a1 1 0 011-1h3"
      />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 15v4a3 3 0 003 3l1-4 3-4V4H5.72a2 2 0 00-1.96 1.61l-1.39 7A2 2 0 004.33 15H10zm7-13h3a1 1 0 011 1v9a1 1 0 01-1 1h-3"
      />
    </svg>
  );
}
