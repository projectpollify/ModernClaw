import { useChatStore } from '@/stores/chatStore';
import { useVoiceStore } from '@/stores/voiceStore';

export function ErrorBanner() {
  const { error: chatError, clearError: clearChatError } = useChatStore();
  const { error: voiceError, clearError: clearVoiceError } = useVoiceStore();

  if (!chatError && !voiceError) {
    return null;
  }

  return (
    <div className="mx-4 mb-4 space-y-3">
      {chatError ? (
        <Banner message={chatError} onDismiss={clearChatError} />
      ) : null}
      {voiceError ? (
        <Banner message={voiceError} onDismiss={clearVoiceError} />
      ) : null}
    </div>
  );
}

function Banner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3">
      <span className="text-sm text-red-500">{message}</span>
      <button onClick={onDismiss} className="text-sm text-red-500 hover:text-red-400">
        Dismiss
      </button>
    </div>
  );
}