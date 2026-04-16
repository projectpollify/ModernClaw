import { Button } from '@/components/ui/Button';
import { CURATED_FLOOR_MODELS, formatWorkspaceModelName } from '@/lib/voiceCatalog';
import { useModelStore } from '@/stores/modelStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useViewStore } from '@/stores/uiStore';

export function ModelDownloader() {
  const setView = useViewStore((state) => state.setView);
  const settings = useSettingsStore((state) => state.settings);
  const engineStatus = useModelStore((state) => state.engineStatus);
  const refresh = useModelStore((state) => state.refresh);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
        ModernClaw can launch the supported Gemma 4 workspace model directly through
        <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">llama-server.exe</code>.
        Leave the advanced GGUF override blank unless you want to force a specific local file.
      </div>

      <div className="rounded-2xl border border-border bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recommended Aliases</p>
        <div className="mt-3 grid gap-2">
          {CURATED_FLOOR_MODELS.map((model) => (
            <div key={model.name} className="rounded-xl border border-border/70 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{model.label}</p>
                  <p className="text-xs text-muted-foreground">{model.name}</p>
                </div>
                <span className="text-muted-foreground">{model.laneLabel}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{model.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
        <p className="font-medium">Current model source</p>
        <p className="mt-2 break-all text-muted-foreground">
          {settings.directEngineModelPath || formatWorkspaceModelName(settings.defaultModel) || 'No workspace model selected yet.'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Engine status: {engineStatus?.running ? 'running' : 'offline'}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setView('settings')}>Open Settings</Button>
        <Button variant="outline" onClick={() => void refresh()}>
          Refresh Models
        </Button>
      </div>
    </div>
  );
}
