import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { convertAudioBlobToWav } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVoiceStore } from '@/stores/voiceStore';

export function MessageInput() {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingMic, setIsPreparingMic] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { sendMessage, isLoading } = useChatStore();
  const settings = useSettingsStore((state) => state.settings);
  const { transcribeAudio, isTranscribing, setError } = useVoiceStore();

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) {
      return;
    }

    void sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const wantsShortcutSend = event.ctrlKey || event.metaKey;
    const shouldSend =
      event.key === 'Enter' &&
      !event.shiftKey &&
      (settings.sendOnEnter ? !wantsShortcutSend : wantsShortcutSend);

    if (shouldSend) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!settings.enableVoiceInput) {
      setError('Voice input is disabled in Settings.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This device does not support microphone capture in the app.');
      return;
    }

    setIsPreparingMic(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getPreferredMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError('Microphone recording failed.');
        setIsRecording(false);
        setIsPreparingMic(false);
        stopStream();
      };

      recorder.onstop = () => {
        void finalizeRecording(recorder.mimeType || mimeType || 'audio/webm');
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setError(`Unable to access the microphone. (${String(error)})`);
      stopStream();
    } finally {
      setIsPreparingMic(false);
    }
  };

  const finalizeRecording = async (mimeType: string) => {
    try {
      const audioBlob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      stopStream();

      if (audioBlob.size === 0) {
        setError('No audio was captured.');
        return;
      }

      const wavBytes = await convertAudioBlobToWav(audioBlob);
      const transcript = await transcribeAudio(wavBytes);

      if (transcript === null) {
        return;
      }

      const cleaned = transcript.trim();
      if (!cleaned) {
        setError('Whisper did not detect usable speech. Try speaking a little louder or recording a bit longer.');
        return;
      }

      setInput((current) => (current ? `${current} ${cleaned}`.trim() : cleaned));
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (error) {
      setError(`Voice transcription failed. (${String(error)})`);
    }
  };

  const stopStream = () => {
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  };

  const canUseVoiceInput = settings.enableVoiceInput;

  return (
    <div className="mx-auto flex max-w-3xl items-end gap-2">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={canUseVoiceInput ? 'Type a message or record with the mic...' : 'Type a message...'}
          disabled={isLoading || isTranscribing}
          rows={1}
          className={cn(
            'w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />

        {input.length > 500 && (
          <span className="absolute bottom-1 right-14 text-xs text-muted-foreground">
            {input.length}
          </span>
        )}
      </div>

      {canUseVoiceInput ? (
        <button
          onClick={() => void handleVoiceToggle()}
          disabled={isLoading || isTranscribing || isPreparingMic}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          className={cn(
            'rounded-xl border border-border p-3 transition-colors',
            isRecording
              ? 'border-red-500/40 bg-red-500/10 text-red-600 hover:bg-red-500/15'
              : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {isPreparingMic ? <SpinnerIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" recording={isRecording} />}
        </button>
      ) : null}

      <button
        onClick={handleSubmit}
        disabled={!input.trim() || isLoading || isTranscribing}
        className={cn(
          'rounded-xl bg-primary p-3 text-primary-foreground transition-colors hover:bg-primary/90',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <SendIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function getPreferredMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((value) => MediaRecorder.isTypeSupported(value));
}

function MicIcon({ className, recording = false }: { className?: string; recording?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={recording ? 'M12 6v6m0 0v4m0-4l3-3m-3 3l-3-3M8 5a4 4 0 118 0v3a4 4 0 11-8 0V5zm-1 7a5 5 0 0010 0m-8 7h6' : 'M12 1a3 3 0 00-3 3v7a3 3 0 106 0V4a3 3 0 00-3-3zm5 10a5 5 0 01-10 0m5 5v3m-4 0h8'}
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}
