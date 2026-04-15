import { ModelCard } from './ModelCard';
import { ModelDownloader } from './ModelDownloader';
import { useModelStore } from '@/stores/modelStore';

export function ModelList() {
  const models = useModelStore((state) => state.models);
  const isLoading = useModelStore((state) => state.isLoading);
  const engineStatus = useModelStore((state) => state.engineStatus);
  const error = useModelStore((state) => state.error);
  const clearError = useModelStore((state) => state.clearError);
  const refresh = useModelStore((state) => state.refresh);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Model Management</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the active direct-engine model, verify discovery, and reveal local GGUF files.
            </p>
          </div>
          <button
            onClick={() => void refresh()}
            className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Refresh
          </button>
        </div>

        {!engineStatus?.running ? (
          <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-700">
            Direct Engine is not running. Start llama-server to verify served models and chat readiness.
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
            <span>{error}</span>
            <button onClick={clearError} className="rounded-md px-2 py-1 hover:bg-red-500/10">
              Dismiss
            </button>
          </div>
        ) : null}

        <section className="mb-8 rounded-3xl border border-border bg-background/70 p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Direct Engine Setup
          </h3>
          <ModelDownloader />
        </section>

        <section className="rounded-3xl border border-border bg-background/70 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Discovered Models
            </h3>
            <span className="text-sm text-muted-foreground">{models.length}</span>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading models...</p>
          ) : models.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No models discovered yet. Configure a GGUF model path in Settings, then refresh.
            </p>
          ) : (
            <div className="grid gap-4">
              {models.map((model) => (
                <ModelCard key={model.name} model={model} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
