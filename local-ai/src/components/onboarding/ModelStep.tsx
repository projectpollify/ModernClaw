import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CURATED_FLOOR_MODELS } from '@/lib/voiceCatalog';
import { useModelStore } from '@/stores/modelStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useViewStore } from '@/stores/uiStore';

interface ModelStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ModelStep({ onNext, onBack }: ModelStepProps) {
  const models = useModelStore((state) => state.models);
  const loadModels = useModelStore((state) => state.loadModels);
  const error = useModelStore((state) => state.error);
  const settings = useSettingsStore((state) => state.settings);
  const setView = useViewStore((state) => state.setView);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const hasConfiguredModel = Boolean(settings.directEngineModelPath) && models.length > 0;

  return (
    <StepShell
      eyebrow="Step 2"
      title="Choose a GGUF Model"
      description="Set the GGUF path that llama-server should load, then confirm ModernClaw can discover the model alias."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!hasConfiguredModel}
      backLabel="Back"
      nextLabel={hasConfiguredModel ? 'Continue to Workspace' : 'Continue'}
    >
      {hasConfiguredModel ? (
        <div className="rounded-[28px] border border-green-500/25 bg-green-500/10 p-6">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Configured Model Ready</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {models.map((model) => model.name).join(', ')}. The next step is confirming the workspace files.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-border bg-background/70 p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              ModernClaw expects a local GGUF file and a llama-server executable. Configure those in Settings, then refresh this step.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Current GGUF path: {settings.directEngineModelPath || 'Not configured yet.'}</p>
          </div>

          <div className="grid gap-3">
            {CURATED_FLOOR_MODELS.map((model) => (
              <div key={model.name} className="rounded-[24px] border border-border bg-background/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{model.label}</p>
                        <p className="text-xs text-muted-foreground">{model.name}</p>
                      </div>
                      {model.recommended ? (
                        <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs text-primary">Recommended</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{model.description}</p>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">{model.laneLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!hasConfiguredModel ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => setView('settings')}>Open Settings</Button>
          <Button variant="outline" onClick={() => void loadModels()}>
            Refresh Discovery
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
