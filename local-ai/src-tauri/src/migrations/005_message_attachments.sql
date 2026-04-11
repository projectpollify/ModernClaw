ALTER TABLE messages ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]';

INSERT OR IGNORE INTO schema_version (version, applied_at)
VALUES (5, datetime('now'));
