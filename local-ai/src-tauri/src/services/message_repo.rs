use crate::services::database::Database;
use crate::types::Message;
use chrono::{DateTime, Utc};

pub struct MessageRepository<'a> {
    db: &'a Database,
}

impl<'a> MessageRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, message: &Message) -> Result<(), String> {
        self.db.execute(
            r#"
            INSERT INTO messages (id, conversation_id, role, content, tokens_used, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            &[
                &message.id,
                &message.conversation_id,
                &message.role,
                &message.content,
                &message.tokens_used,
                &message.created_at.to_rfc3339(),
            ],
        )?;

        Ok(())
    }

    pub fn get_for_conversation(&self, conversation_id: &str) -> Result<Vec<Message>, String> {
        self.db.query_all(
            r#"
            SELECT id, conversation_id, role, content, tokens_used, created_at
            FROM messages
            WHERE conversation_id = ?1
            ORDER BY created_at ASC
            "#,
            &[&conversation_id],
            |row| {
                Ok(Message {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    tokens_used: row.get(4)?,
                    created_at: parse_rfc3339(row.get(5)?)?,
                })
            },
        )
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        self.db.execute("DELETE FROM messages WHERE id = ?1", &[&id])?;
        Ok(())
    }

    pub fn count(&self, conversation_id: &str) -> Result<i32, String> {
        self.db
            .query_one(
                "SELECT COUNT(*) FROM messages WHERE conversation_id = ?1",
                &[&conversation_id],
                |row| row.get(0),
            )
            .map(|count| count.unwrap_or(0))
    }
}

fn parse_rfc3339(value: String) -> rusqlite::Result<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(&value)
        .map(|value| value.with_timezone(&Utc))
        .map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(
                value.len(),
                rusqlite::types::Type::Text,
                Box::new(error),
            )
        })
}
