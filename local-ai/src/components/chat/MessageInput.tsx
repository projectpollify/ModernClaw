import { type ChangeEvent, type DragEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { convertAudioBlobToWav } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVoiceStore } from '@/stores/voiceStore';

const MESSAGE_CHARACTER_LIMIT = 2000;
const CHARACTER_WARNING_THRESHOLD = 250;
const MAX_IMAGE_ATTACHMENTS = 4;

interface PendingImageAttachment {
  id: string;
  file: File;
  previewUrl: string;
}

export function MessageInput() {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingMic, setIsPreparingMic] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImageAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImagesRef = useRef<PendingImageAttachment[]>([]);
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
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      stopStream();
      pendingImagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleSubmit = () => {
    if ((!input.trim() && pendingImages.length === 0) || isLoading) {
      return;
    }

    const imagesToSend = pendingImages.map((item) => item.file);
    void sendMessage(input.trim(), imagesToSend);
    setInput('');
    clearPendingImages();
    setAttachmentError(null);
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
  const remainingCharacters = MESSAGE_CHARACTER_LIMIT - input.length;

  const handleSelectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    addPendingImages(files);
    event.target.value = '';
  };

  const addPendingImages = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      setAttachmentError('Only image files can be attached right now.');
    } else {
      setAttachmentError(null);
    }

    if (imageFiles.length === 0) {
      return;
    }

    setPendingImages((current) => {
      const availableSlots = Math.max(0, MAX_IMAGE_ATTACHMENTS - current.length);
      const nextFiles = imageFiles.slice(0, availableSlots);

      if (nextFiles.length < imageFiles.length) {
        setAttachmentError(`You can attach up to ${MAX_IMAGE_ATTACHMENTS} images at a time.`);
      }

      const nextItems = nextFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      return [...current, ...nextItems];
    });
  };

  const removePendingImage = (id: string) => {
    setPendingImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const clearPendingImages = () => {
    setPendingImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDraggingImages) {
      setIsDraggingImages(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingImages(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImages(false);
    addPendingImages(Array.from(event.dataTransfer.files ?? []));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>Use up to {MESSAGE_CHARACTER_LIMIT.toLocaleString()} characters to describe what you want.</span>
        <span className={cn(remainingCharacters <= CHARACTER_WARNING_THRESHOLD ? 'text-amber-600' : '')}>
          {remainingCharacters.toLocaleString()} left
        </span>
      </div>
      <div
        className={cn(
          'rounded-2xl border border-border bg-background/90 p-2 transition-colors',
          isDraggingImages && 'border-primary bg-primary/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {pendingImages.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
            {pendingImages.map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-xl border border-border bg-secondary/40">
                <img src={item.previewUrl} alt={item.file.name} className="h-20 w-20 object-cover" />
                <button
                  type="button"
                  onClick={() => removePendingImage(item.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                  aria-label={`Remove ${item.file.name}`}
                  title="Remove image"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MESSAGE_CHARACTER_LIMIT}
              placeholder={
                canUseVoiceInput
                  ? 'Type a message, drop an image, or record with the mic...'
                  : 'Type a message or drop an image...'
              }
              disabled={isLoading || isTranscribing}
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                'placeholder:text-muted-foreground',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />

            {input.length > 0 && (
              <span className="absolute bottom-1 right-14 text-xs text-muted-foreground">
                {input.length}/{MESSAGE_CHARACTER_LIMIT}
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleSelectImages}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isTranscribing || pendingImages.length >= MAX_IMAGE_ATTACHMENTS}
            aria-label="Attach images"
            title="Attach images"
            className={cn(
              'rounded-xl border border-border p-3 transition-colors',
              'bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <ImageIcon className="h-5 w-5" />
          </button>

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
            disabled={(!input.trim() && pendingImages.length === 0) || isLoading || isTranscribing}
            className={cn(
              'rounded-xl bg-primary p-3 text-primary-foreground transition-colors hover:bg-primary/90',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {attachmentError ? <p className="mt-2 px-1 text-xs text-amber-600">{attachmentError}</p> : null}
      {pendingImages.length > 0 ? (
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          {pendingImages.length} image{pendingImages.length === 1 ? '' : 's'} attached. These will be copied into the
          active workspace when you send the message.
        </p>
      ) : null}
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

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16m-2-2l1.5-1.5a2 2 0 012.8 0L20 14m-14 6h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm3-10h.01" />
    </svg>
  );
}
