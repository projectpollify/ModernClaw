import { useEffect, useRef, useState } from 'react';
import { formatWorkspaceModelName, getCuratedFloorModelByName } from '@/lib/voiceCatalog';
import { cn } from '@/lib/utils';
import { useModelStore } from '@/stores/modelStore';

export function ModelSelector() {
  const models = useModelStore((state) => state.models);
  const currentModel = useModelStore((state) => state.currentModel);
  const engineStatus = useModelStore((state) => state.engineStatus);
  const checkStatus = useModelStore((state) => state.checkStatus);
  const isSwitching = useModelStore((state) => state.isSwitching);
  const selectModel = useModelStore((state) => state.selectModel);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const servedModel = models.find((model) => model.served);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModel = async (modelName: string) => {
    setIsOpen(false);
    const didSwitch = await selectModel(modelName);
    if (!didSwitch) {
      void checkStatus();
    }
  };

  if (!engineStatus?.running) {
    return (
      <button
        onClick={() => void checkStatus()}
        className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/15"
      >
        Direct Engine Offline
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        disabled={isSwitching}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-full border border-border bg-secondary/70 px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          'hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="max-w-44 truncate">
          {isSwitching ? 'Switching model...' : formatWorkspaceModelName(currentModel) || 'Select Model'}
        </span>
        <ChevronIcon className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Installed Models</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choosing a model here saves it as the default for this workspace.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Served now: {formatWorkspaceModelName(servedModel?.name) || 'Unknown'}
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {models.length > 0 ? (
              models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => void handleSelectModel(model.name)}
                  disabled={isSwitching}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    'hover:bg-accent hover:text-accent-foreground',
                    model.name === currentModel && 'bg-accent text-accent-foreground'
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{formatWorkspaceModelName(model.name) || model.name}</span>
                    {getCuratedFloorModelByName(model.name) ? (
                      <span className="block truncate text-xs text-muted-foreground">{model.name}</span>
                    ) : null}
                  </span>
                  {model.served ? <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-green-600">Live</span> : null}
                  <span className="text-xs text-muted-foreground">{formatSize(model.size)}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No models installed
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return 'Ready';
  }

  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)}GB`;
  }

  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)}MB`;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
