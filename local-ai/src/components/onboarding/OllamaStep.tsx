import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useModelStore } from '@/stores/modelStore';

interface OllamaStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function OllamaStep({ onNext, onBack }: OllamaStepProps) {
  const ollamaStatus = useModelStore((state) => state.ollamaStatus);
  const checkStatus = useModelStore((state) => state.checkStatus);
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

  const isRunning = ollamaStatus?.running ?? false;

  return (
    <StepShell
      eyebrow="Step 1"
      title="Check Ollama"
      description="ModernClaw talks to Ollama on your machine to run the model layer."
      backLabel="Back"
      nextLabel="Continue"
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isRunning}
    >
      {isChecking ? (
        <StatusCard tone="neutral" title="Checking for Ollama..." description="Looking for a running Ollama instance on localhost:11434." />
      ) : isRunning ? (
        <StatusCard
          tone="success"
          title="Ollama is running"
          description={ollamaStatus?.version ? `Version detected: ${ollamaStatus.version}` : 'You are ready for the next step.'}
        />
      ) : (
        <StatusCard
          tone="warning"
          title="Ollama not detected"
          description="Install and start Ollama, then check again. ModernClaw depends on it for model execution."
        >
          <div className="mt-5 rounded-2xl bg-background/60 p-4 text-left text-sm leading-7 text-muted-foreground">
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Install Ollama from{' '}
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  ollama.com
                </a>
                .
              </li>
              <li>Start Ollama on this machine.</li>
              <li>Come back and click Check Again.</li>
            </ol>
          </div>

          <div className="mt-6">
            <Button variant="outline" onClick={() => void runCheck()}>
              Check Again
            </Button>
          </div>
        </StatusCard>
      )}
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


