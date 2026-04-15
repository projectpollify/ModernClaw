export interface DbConversation {
  id: string;
  title: string;
  model: string;
  message_count: number;
  preview: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  feedback: 'up' | 'down' | null;
  feedback_note: string | null;
  created_at: string;
}

export interface DbSetting {
  key: string;
  value: string;
  updated_at: string;
}
