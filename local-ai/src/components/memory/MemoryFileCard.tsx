import { useState } from 'react';
import type { MemoryFile } from '@/services/memory';
import { MemoryEditor } from '@/components/memory/MemoryEditor';
import { formatCharacterRange, getContentGuidance, getLengthState } from '@/lib/contentGuidance';

interface MemoryFileCardProps {
  title: string;
  description: string;
  file: MemoryFile | null;
}

export function MemoryFileCard({ title, description, file }: MemoryFileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const preview = buildPreview(file?.content ?? '');
  const wordCount = countWords(file?.content ?? '');
  const contentLength = file?.content.length ?? 0;
  const guidance = getContentGuidance(title);
  const lengthState = getLengthState(contentLength, guidance);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="group flex h-full flex-col rounded-3xl border border-border bg-background/80 p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Core File
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            Edit
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          Recommended length: {formatCharacterRange(guidance)}
        </p>

        <div className="mt-4 flex-1 rounded-2xl border border-border/70 bg-secondary/35 p-3">
          <p className="line-clamp-5 whitespace-pre-wrap font-mono text-xs leading-6 text-muted-foreground">
            {preview}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{wordCount} words</span>
            <span className={lengthBadgeClass(lengthState)}>{lengthBadgeLabel(lengthState)}</span>
          </div>
          <span>{file?.modified_at ? formatRelativeTime(file.modified_at) : 'Not edited yet'}</span>
        </div>
      </button>

      {isEditing ? (
        <MemoryEditor
          filename={title}
          initialContent={file?.content ?? ''}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </>
  );
}

function buildPreview(content: string) {
  const normalized = content.trim();
  if (!normalized) {
    return 'This file is empty. Click to start writing.';
  }

  return normalized.slice(0, 220) + (normalized.length > 220 ? '...' : '');
}

function countWords(content: string) {
  return content.split(/\s+/).filter(Boolean).length;
}

function formatRelativeTime(dateString: string) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return parsed.toLocaleDateString();
}

function lengthBadgeLabel(state: ReturnType<typeof getLengthState>) {
  switch (state) {
    case 'good':
      return 'In range';
    case 'short':
      return 'Too short';
    case 'long':
      return 'Getting long';
    case 'over':
      return 'Over budget';
  }
}

function lengthBadgeClass(state: ReturnType<typeof getLengthState>) {
  switch (state) {
    case 'good':
      return 'rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-700';
    case 'short':
      return 'rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium text-sky-700';
    case 'long':
      return 'rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-700';
    case 'over':
      return 'rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-700';
  }
}
