import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrainActivityEntry, BrainSuggestion, KnowledgeIntakeRecord, SuggestionStatus } from '@/types';

interface SuggestionState {
  suggestions: BrainSuggestion[];
  draftAnswers: Record<string, string>;
  activityLog: BrainActivityEntry[];
  recentKnowledge: KnowledgeIntakeRecord[];
  updateStatus: (id: string, status: SuggestionStatus) => void;
  setDraftAnswer: (id: string, value: string) => void;
  clearDraftAnswer: (id: string) => void;
  addActivity: (entry: Omit<BrainActivityEntry, 'id' | 'createdAt'>) => void;
  addKnowledgeRecord: (record: Omit<KnowledgeIntakeRecord, 'id' | 'createdAt'>) => void;
  resetSuggestions: () => void;
}

const makeInitialSuggestions = (): BrainSuggestion[] => [
  {
    id: 'profile-role',
    title: 'Clarify your primary role',
    summary: 'Add a stronger work identity to USER.md so the assistant can personalize its advice more accurately.',
    kind: 'profile',
    target: 'USER.md',
    reason: 'The current profile has personal context, but not a strong work or project identity.',
    status: 'pending',
    createdAt: '2026-03-30',
    questionPrompt: 'What kind of work do you do most often, and what do you want this AI to help you with?',
  },
  {
    id: 'memory-projects',
    title: 'Add active project tracking',
    summary: 'Create a dedicated section in MEMORY.md for active projects and current priorities.',
    kind: 'memory',
    target: 'MEMORY.md',
    reason: 'The memory file should become the durable index for ongoing work, not just static notes.',
    status: 'pending',
    createdAt: '2026-03-30',
    proposedContent: '## Active Projects\n- ModernClaw product differentiation\n- Mac version validation\n- Public release preparation',
  },
  {
    id: 'knowledge-source-intake',
    title: 'Start a knowledge intake workflow',
    summary: 'Add a lightweight path for attaching source material and turning it into structured knowledge files.',
    kind: 'knowledge',
    target: 'knowledge/',
    reason: 'A useful brain needs more than chat history. It should grow from curated source material.',
    status: 'pending',
    createdAt: '2026-03-30',
  },
  {
    id: 'behavior-structured-output',
    title: 'Refine assistant output structure',
    summary: 'Teach SOUL.md to prefer structured, decision-ready outputs when the user is building plans or products.',
    kind: 'behavior',
    target: 'SOUL.md',
    reason: 'The differentiated product should feel like an evolving strategic partner, not just a chat bot.',
    status: 'pending',
    createdAt: '2026-03-30',
  },
];

function makeInitialState(): Pick<
  SuggestionState,
  'suggestions' | 'draftAnswers' | 'activityLog' | 'recentKnowledge'
> {
  return {
  suggestions: makeInitialSuggestions(),
  draftAnswers: {},
  activityLog: [],
  recentKnowledge: [],
  };
}

const cloneState = (state: ReturnType<typeof makeInitialState>) => ({
  suggestions: state.suggestions.map((suggestion) => ({ ...suggestion })),
  draftAnswers: { ...state.draftAnswers },
  activityLog: state.activityLog.map((entry) => ({ ...entry })),
  recentKnowledge: state.recentKnowledge.map((record) => ({ ...record })),
});

const defaultState = makeInitialState();

export const useSuggestionStore = create<SuggestionState>()(
  persist(
    (set) => ({
      ...cloneState(defaultState),

      updateStatus: (id, status) =>
        set((state) => ({
          suggestions: state.suggestions.map((suggestion) =>
            suggestion.id === id ? { ...suggestion, status } : suggestion
          ),
        })),

      setDraftAnswer: (id, value) =>
        set((state) => ({
          draftAnswers: {
            ...state.draftAnswers,
            [id]: value,
          },
        })),

      clearDraftAnswer: (id) =>
        set((state) => {
          const nextDraftAnswers = { ...state.draftAnswers };
          delete nextDraftAnswers[id];
          return {
            draftAnswers: nextDraftAnswers,
          };
        }),

      addActivity: (entry) =>
        set((state) => ({
          activityLog: [
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.activityLog,
          ].slice(0, 30),
        })),

      addKnowledgeRecord: (record) =>
        set((state) => ({
          recentKnowledge: [
            {
              ...record,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.recentKnowledge,
          ].slice(0, 12),
        })),

      resetSuggestions: () =>
        set(() => ({
          ...makeInitialState(),
        })),
    }),
    {
      name: 'modernclaw-brain-storage',
      partialize: (state) => ({
        suggestions: state.suggestions,
        draftAnswers: state.draftAnswers,
        activityLog: state.activityLog,
        recentKnowledge: state.recentKnowledge,
      }),
    }
  )
);
