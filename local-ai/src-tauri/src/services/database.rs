use chrono::Utc;
use rusqlite::{Connection, ToSql};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &PathBuf) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|error| format!("Failed to create database directory: {}", error))?;
        }

        let conn =
            Connection::open(path).map_err(|error| format!("Failed to open database: {}", error))?;

        conn.execute("PRAGMA foreign_keys = ON", [])
            .map_err(|error| format!("Failed to enable foreign keys: {}", error))?;
        conn.query_row("PRAGMA journal_mode = WAL", [], |row| row.get::<_, String>(0))
            .map_err(|error| format!("Failed to enable WAL mode: {}", error))?;

        let db = Self {
            conn: Mutex::new(conn),
        };

        db.migrate()?;

        Ok(db)
    }

    fn migrate(&self) -> Result<(), String> {
        let conn = self
            .conn
            .lock()
            .map_err(|error| format!("Failed to lock database connection: {}", error))?;

        let current_version: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_version",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if current_version < 1 {
            conn.execute_batch(include_str!("../migrations/001_initial.sql"))
                .map_err(|error| format!("Migration 001 failed: {}", error))?;
        }

        if current_version < 2 {
            conn.execute_batch(include_str!("../migrations/002_multi_brain_foundations.sql"))
                .map_err(|error| format!("Migration 002 failed: {}", error))?;
        }

        if current_version < 3 {
            conn.execute_batch(include_str!("../migrations/003_agent_voice_settings.sql"))
                .map_err(|error| format!("Migration 003 failed: {}", error))?;
        }

        if current_version < 4 {
            conn.execute_batch(include_str!("../migrations/004_message_feedback.sql"))
                .map_err(|error| format!("Migration 004 failed: {}", error))?;
        }

        if current_version < 5 {
            conn.execute_batch(include_str!("../migrations/005_message_attachments.sql"))
                .map_err(|error| format!("Migration 005 failed: {}", error))?;
        }

        if current_version < 6 {
            conn.execute_batch(include_str!("../migrations/006_message_feedback_note.sql"))
                .map_err(|error| format!("Migration 006 failed: {}", error))?;
        }

        Ok(())
    }

    pub fn execute(&self, sql: &str, params: &[&dyn ToSql]) -> Result<usize, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|error| format!("Failed to lock database connection: {}", error))?;

        conn.execute(sql, params)
            .map_err(|error| format!("Execute failed: {}", error))
    }

    pub fn query_one<T, F>(
        &self,
        sql: &str,
        params: &[&dyn ToSql],
        f: F,
    ) -> Result<Option<T>, String>
    where
        F: FnOnce(&rusqlite::Row<'_>) -> rusqlite::Result<T>,
    {
        let conn = self
            .conn
            .lock()
            .map_err(|error| format!("Failed to lock database connection: {}", error))?;
        let mut stmt = conn
            .prepare(sql)
            .map_err(|error| format!("Prepare failed: {}", error))?;
        let mut rows = stmt
            .query(params)
            .map_err(|error| format!("Query failed: {}", error))?;

        match rows.next() {
            Ok(Some(row)) => f(row)
                .map(Some)
                .map_err(|error| format!("Row parse failed: {}", error)),
            Ok(None) => Ok(None),
            Err(error) => Err(format!("Row fetch failed: {}", error)),
        }
    }

    pub fn query_all<T, F>(
        &self,
        sql: &str,
        params: &[&dyn ToSql],
        f: F,
    ) -> Result<Vec<T>, String>
    where
        F: FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T>,
    {
        let conn = self
            .conn
            .lock()
            .map_err(|error| format!("Failed to lock database connection: {}", error))?;
        let mut stmt = conn
            .prepare(sql)
            .map_err(|error| format!("Prepare failed: {}", error))?;
        let rows = stmt
            .query_map(params, f)
            .map_err(|error| format!("Query failed: {}", error))?;

        rows.collect::<rusqlite::Result<Vec<T>>>()
            .map_err(|error| format!("Collect failed: {}", error))
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        self.query_one(
            "SELECT value FROM settings WHERE key = ?1",
            &[&key],
            |row| row.get(0),
        )
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let now = Utc::now().to_rfc3339();

        self.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            &[&key, &value, &now],
        )?;

        Ok(())
    }

    pub fn list_settings(&self) -> Result<Vec<(String, String)>, String> {
        self.query_all(
            "SELECT key, value FROM settings ORDER BY key ASC",
            &[],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
    }

    pub fn delete_setting(&self, key: &str) -> Result<(), String> {
        self.execute("DELETE FROM settings WHERE key = ?1", &[&key])?;
        Ok(())
    }

    pub fn clear_settings(&self) -> Result<(), String> {
        self.execute("DELETE FROM settings", &[])?;
        Ok(())
    }
}
