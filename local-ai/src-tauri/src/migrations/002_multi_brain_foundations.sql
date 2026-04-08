CREATE TABLE IF NOT EXISTS agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    workspace_path TEXT NOT NULL,
    default_model TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

ALTER TABLE conversations ADD COLUMN agent_id TEXT NOT NULL DEFAULT 'default';

UPDATE conversations
SET agent_id = 'default'
WHERE agent_id IS NULL OR agent_id = '';

CREATE INDEX IF NOT EXISTS idx_conversations_agent_updated
ON conversations(agent_id, updated_at DESC);

INSERT OR IGNORE INTO schema_version (version, applied_at)
VALUES (2, datetime('now'));
