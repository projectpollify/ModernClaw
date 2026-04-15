import { useState } from 'react';
import { formatWorkspaceModelName, getCuratedFloorModelByName } from '@/lib/voiceCatalog';
import { cn } from '@/lib/utils';
import type { Model } from '@/services/engine';
import { useModelStore } from '@/stores/modelStore';
import { ModelInfo } from './ModelInfo';

interface ModelCardProps {
  model: Model;
}

export function ModelCard({ model }: ModelCardProps) {
  const currentModel = useModelStore((state) => state.currentModel);
  const isSwitching = useModelStore((state) => state.isSwitching);
  const deleteModel = useModelStore((state) => state.deleteModel);
  const selectModel = useModelStore((state) => state.selectModel);
  const [showInfo, setShowInfo] = useState(false);
  const isActive = model.name === currentModel;
  const curatedModel = getCuratedFloorModelByName(model.name);

  const handleSelect = async () => {
    await selectModel(model.name);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-colors',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background/80 hover:border-primary/40'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{formatWorkspaceModelName(model.name) || model.name}</h3>
          {curatedModel ? <p className="mt-1 text-xs text-muted-foreground">{model.name}</p> : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {model.details.parameter_size || 'Unknown size'} -{' '}
            {model.details.quantization_level || 'Unknown quantization'}
          </p>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">{formatSize(model.size)}</span>
      </div>
      {model.served ? (
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-green-600">Currently served by Direct Engine</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isActive ? (
          <button
            onClick={() => void handleSelect()}
            disabled={isSwitching}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSwitching ? 'Switching...' : 'Use This Model'}
          </button>
        ) : (
          <span className="rounded-md px-3 py-1.5 text-sm text-green-600">Active</span>
        )}

        <button
          onClick={() => setShowInfo((value) => !value)}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {showInfo ? 'Hide Info' : 'Info'}
        </button>

        {model.path ? (
          <button
            onClick={() => void deleteModel(model.name)}
            className="rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-500/10"
          >
            Open Location
          </button>
        ) : null}
      </div>

      {showInfo ? <ModelInfo model={model} /> : null}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return 'Managed';
  }

  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)}GB`;
  }

  return `${Math.round(bytes / (1024 * 1024))}MB`;
}
