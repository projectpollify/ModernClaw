ALTER TABLE messages ADD COLUMN feedback_note TEXT;

INSERT OR IGNORE INTO schema_version (version, applied_at)
VALUES (6, datetime('now'));
