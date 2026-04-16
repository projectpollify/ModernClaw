import { useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBanner } from './ErrorBanner';
import { EmptyState } from './EmptyState';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { SetupAttentionBanner } from './SetupAttentionBanner';
import { DEFAULT_FLOOR_MODEL, formatWorkspaceModelName } from '@/lib/voiceCatalog';
import { normalizeDefaultModel } from '@/types/settings';
import { useAgentStore } from '@/stores/agentStore';
import { useChatStore } from '@/stores/chatStore';
import { useModelStore } from '@/stores/modelStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function ChatView() {
  const { messages, isLoading, streamingContent, streamingMetrics } = useChatStore();
  const [startupMaskComplete, setStartupMaskComplete] = useState(false);
  const activeAgent = useAgentStore((state) => state.activeAgent);
  const hasLoadedAgents = useAgentStore((state) => state.hasLoaded);
  const engineStatus = useModelStore((state) => state.engineStatus);
  const settings = useSettingsStore((state) => state.settings);
  const hasLoadedSettings = useSettingsStore((state) => state.hasLoaded);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedWorkspaceModel = normalizeDefaultModel(activeAgent?.defaultModel ?? settings.defaultModel ?? null);
  const canAutoStartManagedEngine = useMemo(() => {
    const hasManagedModelSelection = selectedWorkspaceModel === DEFAULT_FLOOR_MODEL;
    const hasAdvancedModelOverride = Boolean(settings.directEngineModelPath?.trim());

    return Boolean(
      engineStatus?.executableFound &&
        !engineStatus.running &&
        (hasManagedModelSelection || hasAdvancedModelOverride || engineStatus.modelFound)
    );
  }, [engineStatus, selectedWorkspaceModel, settings.directEngineModelPath]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, streamingContent, streamingMetrics]);

  useEffect(() => {
    if (startupMaskComplete || !hasLoadedSettings || !hasLoadedAgents || !engineStatus) {
      return;
    }

    if (engineStatus.running || !canAutoStartManagedEngine) {
      setStartupMaskComplete(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStartupMaskComplete(true);
    }, 9000);

    return () => window.clearTimeout(timeoutId);
  }, [canAutoStartManagedEngine, engineStatus, hasLoadedAgents, hasLoadedSettings, startupMaskComplete]);

  const showStartupMask =
    !startupMaskComplete &&
    hasLoadedSettings &&
    hasLoadedAgents &&
    Boolean(engineStatus) &&
    canAutoStartManagedEngine;

  return (
    <div className="flex h-full flex-col">
      {showStartupMask ? (
        <StartupLoadingScreen selectedModel={selectedWorkspaceModel} />
      ) : (
        <>
          <SetupAttentionBanner />
          <ErrorBanner />
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <MessageList messages={messages} isLoading={isLoading} />
            )}
          </div>

          <div className="border-t border-border bg-background/90 p-4 backdrop-blur">
            <MessageInput />
          </div>
        </>
      )}
    </div>
  );
}

function StartupLoadingScreen({ selectedModel }: { selectedModel: string | null }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-[28px] border border-border bg-background/90 p-8 text-center shadow-[0_20px_80px_rgba(15,23,42,0.14)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SpinnerIcon className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Starting Workspace
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bringing Direct Engine online</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          ModernClaw is warming up the local engine
          {selectedModel ? ` for ${formatWorkspaceModelName(selectedModel) || selectedModel}` : ''}. This usually takes a few seconds.
        </p>
      </div>
    </div>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="origin-center animate-spin"
        d="M22 12a10 10 0 00-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
