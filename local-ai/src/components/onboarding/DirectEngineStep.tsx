import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSetupActions } from '@/hooks/useSetupActions';
import { useModelStore } from '@/stores/modelStore';

interface DirectEngineStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function DirectEngineStep({ onNext, onBack }: DirectEngineStepProps) {
  const engineStatus = useModelStore((state) => state.engineStatus);
  const checkStatus = useModelStore((state) => state.checkStatus);
  const {
    openDirectEngineDownload,
    startDirectEngine,
    isOpeningDownload,
    isStartingDirectEngine,
    actionError,
    actionNotice,
    clearActionError,
    clearActionNotice,
  } = useSetupActions();
  const [isChecking, setIsChecking] = useState(true);

  const runCheck = async () => {
    setIsChecking(true);
    try {
      await checkStatus();
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    void runCheck();
  }, []);

  const isRunning = engineStatus?.running ?? false;

  return (
    <StepShell
      eyebrow="Step 1"
      title="Check Direct Engine"
      description="ModernClaw now talks directly to llama-server on your machine through the local direct engine."
      backLabel="Back"
      nextLabel={isRunning ? 'Continue to Model' : 'Continue'}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isRunning}
    >
      {isChecking ? (
        <StatusCard tone="neutral" title="Checking Direct Engine..." description="Looking for llama-server on http://127.0.0.1:8080." />
      ) : isRunning ? (
        <StatusCard
          tone="success"
          title="Direct Engine is running"
          description="The next step is confirming the GGUF model path and discovered model alias."
        />
      ) : (
        <StatusCard
          tone="warning"
          title="Direct Engine not detected"
          description="Install llama.cpp if needed, configure llama-server.exe and a GGUF model path, then start the engine."
        >
          <div className="mt-5 rounded-2xl bg-background/60 p-4 text-left text-sm leading-7 text-muted-foreground">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Install or unpack llama.cpp with <code>llama-server.exe</code>.</li>
              <li>Set the executable path and GGUF path in Settings.</li>
              <li>Come back and click Start Direct Engine.</li>
            </ol>
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => void openDirectEngineDownload()} disabled={isOpeningDownload}>
                {isOpeningDownload ? 'Opening Download...' : 'Get llama.cpp'}
              </Button>
              <Button variant="outline" onClick={() => void startDirectEngine()} disabled={isStartingDirectEngine}>
                {isStartingDirectEngine ? 'Starting Direct Engine...' : 'Start Direct Engine'}
              </Button>
              <Button variant="outline" onClick={() => void runCheck()}>
                Check Again
              </Button>
            </div>
          </div>
        </StatusCard>
      )}

      {actionError ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          <span>{actionError}</span>
          <Button variant="ghost" size="sm" onClick={clearActionError}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {actionNotice ? (
        <div
          className={`mt-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
            actionNotice.tone === 'success'
              ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300'
              : 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300'
          }`}
        >
          <span>{actionNotice.message}</span>
          <Button variant="ghost" size="sm" onClick={clearActionNotice}>
            Dismiss
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
  nextDisabled = false,
  nextLabel,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
  backLabel: string;
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

function StatusCard({
  tone,
  title,
  description,
  children,
}: {
  tone: 'neutral' | 'success' | 'warning';
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const toneClasses =
    tone === 'success'
      ? 'border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300'
      : tone === 'warning'
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-border bg-secondary/35 text-foreground';

  return (
    <div className={`rounded-[28px] border p-8 text-center ${toneClasses}`}>
      <div className="mx-auto mb-4 h-10 w-10 rounded-full border border-current/20" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}
