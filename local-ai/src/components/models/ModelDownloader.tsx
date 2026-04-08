import { useState } from 'react';
import { DEFAULT_FLOOR_MODEL } from '@/lib/voiceCatalog';
import { cn } from '@/lib/utils';
import { useModelStore } from '@/stores/modelStore';

const POPULAR_MODELS = [
  { name: DEFAULT_FLOOR_MODEL, size: '9.6GB', desc: 'Primary ModernClaw model. Stronger quality lane for the base local workspace experience.' },
];

export function ModelDownloader() {
  const [customModel, setCustomModel] = useState('');
  const downloadModel = useModelStore((state) => state.downloadModel);
  const downloadingModel = useModelStore((state) => state.downloadingModel);

  const handleDownload = (name: string) => {
    void downloadModel(name);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
        ModernClaw is currently tuned around one primary Gemma 4 lane. Keep the setup focused there for the most predictable local experience, and only pull custom models if you are intentionally testing beyond the supported path.
      </div>

      <div className="flex flex-wrap gap-2">
        {POPULAR_MODELS.map((model) => (
          <button
            key={model.name}
            onClick={() => handleDownload(model.name)}
            disabled={Boolean(downloadingModel)}
            className={cn(
              'rounded-xl border border-border bg-background px-3 py-2 text-left text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            title={model.desc}
          >
            <span className="font-medium">{model.name}</span>
            <span className="ml-2 text-muted-foreground">{model.size}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customModel}
          onChange={(event) => setCustomModel(event.target.value)}
          placeholder="Optional custom model, e.g. llama3.1:8b"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
        />
        <button
          onClick={() => handleDownload(customModel)}
          disabled={!customModel.trim() || Boolean(downloadingModel)}
          className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download
        </button>
      </div>

      {downloadingModel ? (
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-sm">
            Downloading <span className="font-medium">{downloadingModel}</span>...
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
