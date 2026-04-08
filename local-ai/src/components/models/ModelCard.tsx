import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Model } from '@/services/ollama';
import { useAgentStore } from '@/stores/agentStore';
import { useModelStore } from '@/stores/modelStore';
import { ModelInfo } from './ModelInfo';

interface ModelCardProps {
  model: Model;
}

export function ModelCard({ model }: ModelCardProps) {
  const currentModel = useModelStore((state) => state.currentModel);
  const setCurrentModel = useModelStore((state) => state.setCurrentModel);
  const deleteModel = useModelStore((state) => state.deleteModel);
  const updateActiveAgentDefaultModel = useAgentStore((state) => state.updateActiveAgentDefaultModel);
  const [showInfo, setShowInfo] = useState(false);
  const isActive = model.name === currentModel;

  const handleSelect = async () => {
    setCurrentModel(model.name);
    await updateActiveAgentDefaultModel(model.name);
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
          <h3 className="truncate text-base font-semibold">{model.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {model.details.parameter_size || 'Unknown size'} -{' '}
            {model.details.quantization_level || 'Unknown quantization'}
          </p>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">{formatSize(model.size)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isActive ? (
          <button
            onClick={() => void handleSelect()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Use This Model
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

        <button
          onClick={() => void deleteModel(model.name)}
          className="rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>

      {showInfo ? <ModelInfo model={model} /> : null}
    </div>
  );
}

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)}GB`;
  }

  return `${Math.round(bytes / (1024 * 1024))}MB`;
}
