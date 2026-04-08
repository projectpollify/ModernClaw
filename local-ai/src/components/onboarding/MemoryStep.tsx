import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { useMemoryStore } from '@/stores/memoryStore';

interface MemoryStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function MemoryStep({ onNext, onBack }: MemoryStepProps) {
  const initialize = useMemoryStore((state) => state.initialize);
  const soul = useMemoryStore((state) => state.soul);
  const user = useMemoryStore((state) => state.user);
  const memory = useMemoryStore((state) => state.memory);
  const basePath = useMemoryStore((state) => state.basePath);
  const isLoading = useMemoryStore((state) => state.isLoading);
  const error = useMemoryStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const previews = useMemo(
    () => [
      {
        name: 'SOUL.md',
        description: 'The assistant personality and behavior file.',
        exists: Boolean(soul?.exists),
      },
      {
        name: 'USER.md',
        description: 'Stable personal and household details about you.',
        exists: Boolean(user?.exists),
      },
      {
        name: 'MEMORY.md',
        description: 'Long-term facts, preferences, decisions, and active projects.',
        exists: Boolean(memory?.exists),
      },
    ],
    [memory?.exists, soul?.exists, user?.exists]
  );

  return (
    <div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Step 3</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Initialize Memory</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          ModernClaw creates plain Markdown files so you can inspect, edit, and control what the assistant remembers.
        </p>
      </div>

      <div className="mt-8 rounded-[28px] border border-border bg-background/70 p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Setting up memory files...</p>
        ) : (
          <>
            <div className="grid gap-3">
              {previews.map((file) => (
                <div key={file.name} className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{file.description}</p>
                  </div>
                  <span className={file.exists ? 'text-green-600 dark:text-green-300' : 'text-muted-foreground'}>
                    {file.exists ? 'Ready' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            {basePath ? (
              <p className="mt-5 text-xs text-muted-foreground">Stored at: {basePath}</p>
            ) : null}
          </>
        )}

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  );
}

