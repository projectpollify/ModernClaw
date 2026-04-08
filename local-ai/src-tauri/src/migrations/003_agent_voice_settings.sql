ALTER TABLE agents ADD COLUMN enable_voice_output INTEGER;
ALTER TABLE agents ADD COLUMN piper_voice_preset TEXT;
ALTER TABLE agents ADD COLUMN piper_model_path TEXT;
ALTER TABLE agents ADD COLUMN enable_voice_input INTEGER;
ALTER TABLE agents ADD COLUMN whisper_model_path TEXT;
ALTER TABLE agents ADD COLUMN whisper_language TEXT;

UPDATE agents
SET piper_voice_preset = 'amy-medium'
WHERE agent_id = 'default'
  AND (piper_voice_preset IS NULL OR piper_voice_preset = '');

INSERT OR IGNORE INTO schema_version (version, applied_at)
VALUES (3, datetime('now'));
