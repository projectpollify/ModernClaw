import { useEffect, useRef } from 'react';
import { ErrorBanner } from './ErrorBanner';
import { EmptyState } from './EmptyState';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { SetupAttentionBanner } from './SetupAttentionBanner';
import { useChatStore } from '@/stores/chatStore';

export function ChatView() {
  const { messages, isLoading, streamingContent, streamingMetrics } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, streamingContent, streamingMetrics]);

  return (
    <div className="flex h-full flex-col">
      <SetupAttentionBanner />
      <ErrorBanner />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      <div className="border-t border-border bg-background/90 p-4 backdrop-blur">
        <MessageInput />
      </div>
    </div>
  );
}
