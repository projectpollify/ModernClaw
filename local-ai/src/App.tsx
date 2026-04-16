import { AppShell } from '@/components/layout/AppShell';
import { BrainView } from '@/components/brain/BrainView';
import { ChatView } from '@/components/chat/ChatView';
import { MemoryView } from '@/components/memory/MemoryView';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { SetupView } from '@/components/setup/SetupView';
import { SettingsView } from '@/components/settings/SettingsView';
import { resolvePreferredModelName } from '@/lib/modelSelection';
import { DEFAULT_FLOOR_MODEL } from '@/lib/voiceCatalog';
import { useTheme } from '@/hooks/useTheme';
import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { useChatStore } from '@/stores/chatStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useModelStore } from '@/stores/modelStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { useViewStore } from '@/stores/uiStore';
import { normalizeDefaultModel } from '@/types/settings';

function App() {
  useTheme();
  const activeView = useViewStore((state) => state.activeView);
  const loadAgents = useAgentStore((state) => state.loadAgents);
  const activeAgent = useAgentStore((state) => state.activeAgent);
  const hasLoadedAgents = useAgentStore((state) => state.hasLoaded);
  const loadConversations = useConversationStore((state) => state.loadConversations);
  const restoreLatestConversation = useConversationStore((state) => state.restoreLatestConversation);
  const initializeMemory = useMemoryStore((state) => state.initialize);
  const currentModel = useModelStore((state) => state.currentModel);
  const availableModels = useModelStore((state) => state.models);
  const engineStatus = useModelStore((state) => state.engineStatus);
  const refreshModelState = useModelStore((state) => state.refresh);
  const setCurrentModel = useModelStore((state) => state.setCurrentModel);
  const setChatModel = useChatStore((state) => state.setModel);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const settings = useSettingsStore((state) => state.settings);
  const hasLoadedSettings = useSettingsStore((state) => state.hasLoaded);
  const setTheme = useThemeStore((state) => state.setTheme);
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);

  const activeAgentId = activeAgent?.agentId ?? null;
  const activeAgentDefaultModel = activeAgent?.defaultModel ?? null;
  const startupRefreshRequested = useRef(false);
  const selectedWorkspaceModel = normalizeDefaultModel(activeAgentDefaultModel ?? settings.defaultModel ?? null);

  useEffect(() => {
    void loadSettings();
    void loadAgents();
  }, [loadAgents, loadSettings]);

  useEffect(() => {
    if (!hasLoadedSettings) {
      return;
    }

    setTheme(settings.theme);
  }, [hasLoadedSettings, setTheme, settings.theme]);

  useEffect(() => {
    if (!hasLoadedSettings || !hasLoadedAgents || !activeAgentId) {
      return;
    }

    const initializeWorkspace = async () => {
      await initializeMemory();

      if (settings.saveConversationHistory) {
        await loadConversations();
        await restoreLatestConversation();
      }
    };

    void initializeWorkspace();
  }, [
    activeAgentId,
    hasLoadedAgents,
    hasLoadedSettings,
    initializeMemory,
    loadConversations,
    restoreLatestConversation,
    settings.saveConversationHistory,
  ]);

  useEffect(() => {
    if (!hasLoadedSettings || !hasLoadedAgents || !activeAgentId || startupRefreshRequested.current) {
      return;
    }

    startupRefreshRequested.current = true;
    void refreshModelState();
  }, [activeAgentId, hasLoadedAgents, hasLoadedSettings, refreshModelState]);

  useEffect(() => {
    if (!hasLoadedSettings || !hasLoadedAgents || !activeAgentId) {
      return;
    }

    setCurrentModel(
      resolvePreferredModelName(
        selectedWorkspaceModel,
        availableModels.map((model) => model.name)
      )
    );
  }, [
    activeAgentId,
    availableModels,
    hasLoadedAgents,
    hasLoadedSettings,
    setCurrentModel,
    selectedWorkspaceModel,
  ]);

  useEffect(() => {
    if (!hasLoadedSettings || !hasLoadedAgents || !activeAgentId || !engineStatus) {
      return;
    }

    const hasManagedModelSelection = (selectedWorkspaceModel ?? '').trim() === DEFAULT_FLOOR_MODEL;
    const hasAdvancedModelOverride = Boolean(settings.directEngineModelPath?.trim());
    const shouldPollDuringBoot =
      engineStatus.executableFound &&
      !engineStatus.running &&
      (hasManagedModelSelection || hasAdvancedModelOverride || engineStatus.modelFound);

    if (!shouldPollDuringBoot) {
      return;
    }

    let attemptsRemaining = 12;
    const intervalId = window.setInterval(() => {
      attemptsRemaining -= 1;
      void refreshModelState();

      if (attemptsRemaining <= 0) {
        window.clearInterval(intervalId);
      }
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [
    activeAgentId,
    engineStatus,
    hasLoadedAgents,
    hasLoadedSettings,
    refreshModelState,
    selectedWorkspaceModel,
    settings.directEngineModelPath,
  ]);

  useEffect(() => {
    if (currentModel) {
      setChatModel(currentModel);
    }
  }, [currentModel, setChatModel]);

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <AppShell>
      {activeView === 'chat' ? (
        <ChatView />
      ) : activeView === 'memory' ? (
        <MemoryView />
      ) : activeView === 'brain' ? (
        <BrainView />
      ) : activeView === 'setup' ? (
        <SetupView />
      ) : activeView === 'settings' ? (
        <SettingsView />
      ) : (
        <PlaceholderView activeView={activeView} />
      )}
    </AppShell>
  );
}

function PlaceholderView({ activeView }: { activeView: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="rounded-[28px] border border-border bg-secondary/30 p-8 text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {activeView}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">This panel is next</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          The chat view is now live. Memory and settings will be expanded in later modules.
        </p>
      </div>
    </div>
  );
}

export default App;

