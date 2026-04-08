import { invoke } from '@tauri-apps/api/core';
import type { Agent, AgentVoiceSettings } from '@/types';

interface AgentDto {
  agentId: string;
  name: string;
  description?: string;
  status?: string;
  workspacePath?: string;
  defaultModel?: string;
  enableVoiceOutput?: boolean;
  piperVoicePreset?: string;
  piperModelPath?: string;
  enableVoiceInput?: boolean;
  whisperModelPath?: string;
  whisperLanguage?: string;
  createdAt?: string;
  updatedAt?: string;
}

function fromAgentDto(dto: AgentDto): Agent {
  return {
    agentId: dto.agentId,
    name: dto.name,
    description: dto.description ?? undefined,
    status: dto.status ?? undefined,
    workspacePath: dto.workspacePath ?? undefined,
    defaultModel: dto.defaultModel ?? undefined,
    enableVoiceOutput: typeof dto.enableVoiceOutput === 'boolean' ? dto.enableVoiceOutput : undefined,
    piperVoicePreset: dto.piperVoicePreset ?? undefined,
    piperModelPath: dto.piperModelPath ?? undefined,
    enableVoiceInput: typeof dto.enableVoiceInput === 'boolean' ? dto.enableVoiceInput : undefined,
    whisperModelPath: dto.whisperModelPath ?? undefined,
    whisperLanguage: dto.whisperLanguage ?? undefined,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
  };
}

export const agentApi = {
  async getActiveAgent(): Promise<Agent> {
    const agent = await invoke<AgentDto>('agent_get_active');
    return fromAgentDto(agent);
  },

  async updateDefaultModel(agentId: string, defaultModel: string | null): Promise<void> {
    return invoke('agent_update_default_model', { agentId, defaultModel });
  },

  async updateVoiceSettings(agentId: string, voiceSettings: AgentVoiceSettings): Promise<void> {
    return invoke('agent_update_voice_settings', { agentId, voiceSettings });
  },
};
