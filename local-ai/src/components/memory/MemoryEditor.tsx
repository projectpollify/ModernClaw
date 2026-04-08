import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatCharacterRange, formatSoftLimit, getContentGuidance, getLengthState } from '@/lib/contentGuidance';
import { useMemoryStore } from '@/stores/memoryStore';

interface MemoryEditorProps {
  filename: string;
  initialContent: string;
  onClose: () => void;
}

export function MemoryEditor({ filename, initialContent, onClose }: MemoryEditorProps) {
  const saveFile = useMemoryStore((state) => state.saveFile);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const guidance = getContentGuidance(filename);
  const hasChanges = content !== initialContent;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const lengthState = getLengthState(content.length, guidance);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await saveFile(filename, content);
    } catch (saveError) {
      setError(String(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges && !window.confirm('You have unsaved changes. Discard them?')) {
      return;
    }

    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSave();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, hasChanges, initialContent, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex h-[min(88vh,860px)] w-full max-w-5xl flex-col rounded-[32px] border border-border bg-background shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{filename}</h2>
              {hasChanges ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600">
                  Unsaved
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Markdown is stored locally and flows straight into your assistant&apos;s context.
            </p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Recommended length: {formatCharacterRange(guidance)}. Soft limit: {formatSoftLimit(guidance)}.
            </p>
            <p className="text-xs leading-6 text-muted-foreground">{guidance.helper}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={() => void handleSave()} disabled={!hasChanges || isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mx-6 mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {lengthState !== 'good' ? (
          <div className={warningClass(lengthState)}>
            {warningMessage(lengthState, guidance)}
          </div>
        ) : null}

        <div className="flex-1 p-6">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Start writing..."
            spellCheck={false}
            className="h-full min-h-[420px] w-full resize-none rounded-[28px] border border-border bg-secondary/20 px-5 py-4 font-mono text-sm leading-7 outline-none transition-colors focus:border-primary/40"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <span>
            {content.length} characters, {wordCount} words
          </span>
          <span>{statusLabel(lengthState)} · Ctrl/Cmd+S to save, Esc to close</span>
        </div>
      </div>
    </div>
  );
}

function statusLabel(state: ReturnType<typeof getLengthState>) {
  switch (state) {
    case 'good':
      return 'In recommended range';
    case 'short':
      return 'Below recommended range';
    case 'long':
      return 'Above recommended range';
    case 'over':
      return 'Over soft limit';
  }
}

function warningClass(state: ReturnType<typeof getLengthState>) {
  if (state === 'short') {
    return 'mx-6 mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-700';
  }

  if (state === 'long') {
    return 'mx-6 mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700';
  }

  return 'mx-6 mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700';
}

function warningMessage(state: ReturnType<typeof getLengthState>, guidance: ReturnType<typeof getContentGuidance>) {
  if (state === 'short') {
    return `This file is still short for its intended role. A healthy target is ${formatCharacterRange(guidance)}.`;
  }

  if (state === 'long') {
    return `This file is getting long. Consider tightening it so it stays close to ${formatCharacterRange(guidance)}.`;
  }

  return `This file is over the soft limit of ${formatSoftLimit(guidance)}. The prompt may become harder to manage if it keeps growing.`;
}
