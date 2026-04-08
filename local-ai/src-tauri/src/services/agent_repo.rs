use std::path::Path;

use chrono::{DateTime, Utc};

use crate::services::database::Database;
use crate::types::Agent;

pub const DEFAULT_AGENT_ID: &str = "default";
pub const DEFAULT_AGENT_NAME: &str = "Rosie";
const DEFAULT_AGENT_DESCRIPTION: &str = "Baseline ModernClaw workspace running on the primary Gemma 4 lane";
const DEFAULT_AGENT_MODEL: &str = "gemma4:e4b";
const DEFAULT_AGENT_PIPER_VOICE_PRESET: &str = "amy-medium";
const LEGACY_DEFAULT_AGENT_NAME: &str = "Default Brain";
const PREVIOUS_DEFAULT_AGENT_NAME: &str = "Gemma 4";
const LEGACY_DEFAULT_AGENT_MODEL: &str = "nchapman/dolphin3.0-qwen2.5:3b";

pub struct AgentRepository<'a> {
    db: &'a Database,
}

impl<'a> AgentRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, agent: &Agent) -> Result<(), String> {
        self.db.execute(
            r#"
            INSERT INTO agents (
                agent_id,
                name,
                description,
                status,
                workspace_path,
                default_model,
                enable_voice_output,
                piper_voice_preset,
                piper_model_path,
                enable_voice_input,
                whisper_model_path,
                whisper_language,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
            "#,
            &[
                &agent.agent_id,
                &agent.name,
                &agent.description,
                &agent.status,
                &agent.workspace_path,
                &agent.default_model,
                &agent.enable_voice_output,
                &agent.piper_voice_preset,
                &agent.piper_model_path,
                &agent.enable_voice_input,
                &agent.whisper_model_path,
                &agent.whisper_language,
                &agent.created_at.to_rfc3339(),
                &agent.updated_at.to_rfc3339(),
            ],
        )?;

        Ok(())
    }

    pub fn list(&self) -> Result<Vec<Agent>, String> {
        self.db.query_all(
            r#"
            SELECT agent_id, name, description, status, workspace_path, default_model,
                   enable_voice_output, piper_voice_preset, piper_model_path,
                   enable_voice_input, whisper_model_path, whisper_language,
                   created_at, updated_at
            FROM agents
            ORDER BY updated_at DESC, name ASC
            "#,
            &[],
            |row| {
                Ok(Agent {
                    agent_id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    status: row.get(3)?,
                    workspace_path: row.get(4)?,
                    default_model: row.get(5)?,
                    enable_voice_output: row.get(6)?,
                    piper_voice_preset: row.get(7)?,
                    piper_model_path: row.get(8)?,
                    enable_voice_input: row.get(9)?,
                    whisper_model_path: row.get(10)?,
                    whisper_language: row.get(11)?,
                    created_at: parse_rfc3339(row.get(12)?)?,
                    updated_at: parse_rfc3339(row.get(13)?)?,
                })
            },
        )
    }

    pub fn get(&self, agent_id: &str) -> Result<Option<Agent>, String> {
        self.db.query_one(
            r#"
            SELECT agent_id, name, description, status, workspace_path, default_model,
                   enable_voice_output, piper_voice_preset, piper_model_path,
                   enable_voice_input, whisper_model_path, whisper_language,
                   created_at, updated_at
            FROM agents
            WHERE agent_id = ?1
            "#,
            &[&agent_id],
            |row| {
                Ok(Agent {
                    agent_id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    status: row.get(3)?,
                    workspace_path: row.get(4)?,
                    default_model: row.get(5)?,
                    enable_voice_output: row.get(6)?,
                    piper_voice_preset: row.get(7)?,
                    piper_model_path: row.get(8)?,
                    enable_voice_input: row.get(9)?,
                    whisper_model_path: row.get(10)?,
                    whisper_language: row.get(11)?,
                    created_at: parse_rfc3339(row.get(12)?)?,
                    updated_at: parse_rfc3339(row.get(13)?)?,
                })
            },
        )
    }

    pub fn update_default_model(&self, agent_id: &str, default_model: Option<&str>) -> Result<(), String> {
        if self.get(agent_id)?.is_none() {
            return Err(format!("Agent not found: {}", agent_id));
        }

        let now = Utc::now().to_rfc3339();
        let next_model = default_model.map(|value| value.to_string());

        self.db.execute(
            r#"
            UPDATE agents
            SET default_model = ?1,
                updated_at = ?2
            WHERE agent_id = ?3
            "#,
            &[&next_model, &now, &agent_id],
        )?;

        Ok(())
    }

    pub fn update_voice_settings(
        &self,
        agent_id: &str,
        enable_voice_output: Option<bool>,
        piper_voice_preset: Option<&str>,
        piper_model_path: Option<&str>,
        enable_voice_input: Option<bool>,
        whisper_model_path: Option<&str>,
        whisper_language: Option<&str>,
    ) -> Result<(), String> {
        if self.get(agent_id)?.is_none() {
            return Err(format!("Agent not found: {}", agent_id));
        }

        let now = Utc::now().to_rfc3339();
        let next_piper_voice_preset = piper_voice_preset.map(|value| value.to_string());
        let next_piper_model_path = piper_model_path.map(|value| value.to_string());
        let next_whisper_model_path = whisper_model_path.map(|value| value.to_string());
        let next_whisper_language = whisper_language.map(|value| value.to_string());

        self.db.execute(
            r#"
            UPDATE agents
            SET enable_voice_output = ?1,
                piper_voice_preset = ?2,
                piper_model_path = ?3,
                enable_voice_input = ?4,
                whisper_model_path = ?5,
                whisper_language = ?6,
                updated_at = ?7
            WHERE agent_id = ?8
            "#,
            &[
                &enable_voice_output,
                &next_piper_voice_preset,
                &next_piper_model_path,
                &enable_voice_input,
                &next_whisper_model_path,
                &next_whisper_language,
                &now,
                &agent_id,
            ],
        )?;

        Ok(())
    }

    pub fn delete(&self, agent_id: &str) -> Result<(), String> {
        self.db.execute("DELETE FROM agents WHERE agent_id = ?1", &[&agent_id])?;
        Ok(())
    }

    pub fn ensure_default_agent(&self, default_workspace_path: &str) -> Result<(), String> {
        let now = Utc::now().to_rfc3339();
        let default_status = "active";
        let legacy_description = "Migrated baseline single-brain workspace";

        self.db.execute(
            r#"
            INSERT OR IGNORE INTO agents (
                agent_id,
                name,
                description,
                status,
                workspace_path,
                default_model,
                enable_voice_output,
                piper_voice_preset,
                piper_model_path,
                enable_voice_input,
                whisper_model_path,
                whisper_language,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
            "#,
            &[
                &DEFAULT_AGENT_ID,
                &DEFAULT_AGENT_NAME,
                &Some(DEFAULT_AGENT_DESCRIPTION.to_string()),
                &default_status,
                &default_workspace_path,
                &Some(DEFAULT_AGENT_MODEL.to_string()),
                &Option::<bool>::None,
                &Some(DEFAULT_AGENT_PIPER_VOICE_PRESET.to_string()),
                &Option::<String>::None,
                &Option::<bool>::None,
                &Option::<String>::None,
                &Option::<String>::None,
                &now,
                &now,
            ],
        )?;

        self.db.execute(
            r#"
            UPDATE agents
            SET workspace_path = ?1,
                name = CASE
                    WHEN name = ?2 OR name = ?3 THEN ?4
                    ELSE name
                END,
                description = CASE
                    WHEN description IS NULL OR description = '' OR description = ?5 THEN ?6
                    ELSE description
                END,
                default_model = CASE
                    WHEN default_model IS NULL OR default_model = '' OR default_model = ?7 THEN ?8
                    ELSE default_model
                END,
                piper_voice_preset = CASE
                    WHEN piper_voice_preset IS NULL OR piper_voice_preset = '' THEN ?9
                    ELSE piper_voice_preset
                END,
                updated_at = ?10
            WHERE agent_id = ?11
            "#,
            &[
                &default_workspace_path,
                &LEGACY_DEFAULT_AGENT_NAME,
                &PREVIOUS_DEFAULT_AGENT_NAME,
                &DEFAULT_AGENT_NAME,
                &legacy_description,
                &DEFAULT_AGENT_DESCRIPTION,
                &LEGACY_DEFAULT_AGENT_MODEL,
                &DEFAULT_AGENT_MODEL,
                &DEFAULT_AGENT_PIPER_VOICE_PRESET,
                &now,
                &DEFAULT_AGENT_ID,
            ],
        )?;

        if self.db.get_setting("active_agent_id")?.is_none() {
            self.db.set_setting("active_agent_id", DEFAULT_AGENT_ID)?;
        }

        Ok(())
    }

    pub fn get_active_agent_id(&self) -> Result<String, String> {
        Ok(self
            .db
            .get_setting("active_agent_id")?
            .unwrap_or_else(|| DEFAULT_AGENT_ID.to_string()))
    }

    pub fn set_active_agent(&self, agent_id: &str) -> Result<(), String> {
        if self.get(agent_id)?.is_none() {
            return Err(format!("Agent not found: {}", agent_id));
        }

        self.db.set_setting("active_agent_id", agent_id)
    }

    pub fn get_active_agent(&self, default_workspace_path: &str) -> Result<Agent, String> {
        self.ensure_default_agent(default_workspace_path)?;

        let active_agent_id = self.get_active_agent_id()?;

        if let Some(agent) = self.get(&active_agent_id)? {
            return Ok(agent);
        }

        self.db.set_setting("active_agent_id", DEFAULT_AGENT_ID)?;
        self.get(DEFAULT_AGENT_ID)?
            .ok_or_else(|| "Default agent could not be resolved".to_string())
    }

    pub fn resolve_active_workspace_path(&self, default_workspace_path: &str) -> Result<String, String> {
        Ok(self.get_active_agent(default_workspace_path)?.workspace_path)
    }

    pub fn default_workspace_path_for_new_agent(default_workspace_root: &str, agent_id: &str) -> String {
        Path::new(default_workspace_root)
            .join("agents")
            .join(agent_id)
            .to_string_lossy()
            .to_string()
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
