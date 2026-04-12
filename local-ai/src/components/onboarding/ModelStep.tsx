import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSetupActions } from '@/hooks/useSetupActions';
import { CURATED_FLOOR_MODELS, DEFAULT_FLOOR_MODEL } from '@/lib/voiceCatalog';
import { cn } from '@/lib/utils';
import { useModelStore } from '@/stores/modelStore';

interface ModelStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ModelStep({ onNext, onBack }: ModelStepProps) {
  const models = useModelStore((state) => state.models);
  const downloadingModel = useModelStore((state) => state.downloadingModel);
  const loadModels = useModelStore((state) => state.loadModels);
  const error = useModelStore((state) => state.error);
  const clearError = useModelStore((state) => state.clearError);
  const { installRecommendedModel, isInstallingRecommendedModel, actionError, clearActionError } = useSetupActions();
  const [selectedModel, setSelectedModel] = useState(DEFAULT_FLOOR_MODEL);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const hasModels = models.length > 0;
  const installedNames = useMemo(() => new Set(models.map((model) => model.name)), [models]);

  const handleDownload = async () => {
    clearError();
    if (selectedModel === DEFAULT_FLOOR_MODEL) {
      await installRecommendedModel();
      return;
    }

    const modelStore = useModelStore.getState();
    await modelStore.downloadModel(selectedModel);
    await loadModels();
  };

  return (
    <StepShell
      eyebrow="Step 2"
      title="Choose a Model"
      description="Install a supported Gemma 4 model so ModernClaw starts from a strong default lane, with a lighter sibling available if you want a smaller local footprint."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!hasModels}
      backLabel="Back"
      nextLabel="Continue"
    >
      {hasModels ? (
        <div className="rounded-[28px] border border-green-500/25 bg-green-500/10 p-6">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Installed Models Ready</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{models.map((model) => model.name).join(', ')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {CURATED_FLOOR_MODELS.map((model) => (
            <label
              key={model.name}
              className={cn(
                'cursor-pointer rounded-[24px] border p-4 transition-colors',
                selectedModel === model.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background/70 hover:border-primary/40'
              )}
            >
              <input
                type="radio"
                name="recommended-model"
                value={model.name}
                checked={selectedModel === model.name}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{model.name}</p>
                    {model.recommended ? (
                      <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs text-primary">Recommended</span>
                    ) : null}
                    {installedNames.has(model.name) ? (
                      <span className="rounded-full bg-green-500/12 px-2 py-0.5 text-xs text-green-700 dark:text-green-300">
                        Installed
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{model.description}</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{model.size}</span>
              </div>
            </label>
          ))}
        </div>
      )}

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          <span>{actionError}</span>
          <Button variant="ghost" size="sm" onClick={clearActionError}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {!hasModels ? (
        <div className="mt-6 flex items-center justify-center">
          <Button onClick={() => void handleDownload()} disabled={Boolean(downloadingModel) || isInstallingRecommendedModel}>
            {isInstallingRecommendedModel
              ? 'Installing Recommended Model...'
              : downloadingModel
                ? `Downloading ${downloadingModel}...`
                : selectedModel === DEFAULT_FLOOR_MODEL
                  ? 'Install Recommended Model'
                  : `Download ${selectedModel}`}
          </Button>
        </div>
      ) : null}
    </StepShell>
  );
}

function StepShell({
  eyebrow,
  title,
  description,
  children,
  onBack,
  onNext,
  nextDisabled,
  backLabel,
  nextLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  backLabel: string;
  nextLabel: string;
}) {
  return (
    <div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
      </div>

      <div className="mt-8">{children}</div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          {backLabel}
        </Button>
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
