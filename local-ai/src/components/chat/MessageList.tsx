import { MessageBubble } from './MessageBubble';
import { StreamingBubble } from './StreamingBubble';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const { isStreaming, streamingContent, streamingMetrics } = useChatStore();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isStreaming && streamingContent && <StreamingBubble content={streamingContent} metrics={streamingMetrics} />}
      {isLoading && !isStreaming && <TypingIndicator />}
    </div>
  );
}
