use std::collections::{BTreeMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::types::{
    ChatMessage, ChatResponse, DirectEngineSettings, DirectEngineStatus, Model, ModelDetails,
};

const DIRECT_ENGINE_BASE_URL: &str = "http://127.0.0.1:8080";
const DIRECT_ENGINE_FALLBACK_BASE_URL: &str = "http://127.0.0.1:8081";

#[derive(Debug, Deserialize)]
struct ModelsEnvelope {
    data: Vec<OpenAiModel>,
}

#[derive(Debug, Deserialize)]
struct OpenAiModel {
    id: String,
    #[serde(default)]
    created: Option<u64>,
}

#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    model: String,
    #[serde(default)]
    created: Option<u64>,
    #[serde(default)]
    usage: Option<ChatCompletionUsage>,
    choices: Vec<ChatCompletionChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionChoice {
    message: ChatMessage,
    #[serde(default)]
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionUsage {
    #[serde(default)]
    prompt_tokens: Option<u32>,
    #[serde(default)]
    completion_tokens: Option<u32>,
}

#[derive(Clone, Copy)]
pub struct ManagedModelSpec {
    pub alias: &'static str,
    pub hf_repo: &'static str,
    pub launch_label: &'static str,
}

pub struct DirectEngineService {
    client: Client,
    base_url: String,
}

impl DirectEngineService {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(300))
            .build()
            .expect("failed to create direct engine HTTP client");

        Self {
            client,
            base_url: DIRECT_ENGINE_BASE_URL.to_string(),
        }
    }

    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    pub async fn check_status(
        &self,
        settings: Option<&DirectEngineSettings>,
    ) -> DirectEngineStatus {
        let resolved_base_url = self.resolve_base_url().await;
        let executable_path = resolve_executable_path(settings)
            .map(|value| value.to_string_lossy().to_string());
        let configured_model_path = settings
            .and_then(|value| value.model_path.clone())
            .filter(|value| !value.trim().is_empty());
        let local_model_path = configured_model_path
            .clone()
            .or_else(|| resolve_preferred_model_path(settings).map(|value| value.to_string_lossy().to_string()));
        let managed_model = settings
            .and_then(|value| value.default_model.as_deref())
            .and_then(managed_model_spec_for_name);
        let model_path = local_model_path
            .clone()
            .or_else(|| managed_model.map(|value| value.launch_label.to_string()));

        let executable_found = executable_path
            .as_ref()
            .map(|value| Path::new(value).is_file())
            .unwrap_or(false);
        let model_found = local_model_path
            .as_ref()
            .map(|value| Path::new(value).is_file())
            .unwrap_or(managed_model.is_some());

        match resolved_base_url {
            Some(base_url) => DirectEngineStatus {
                running: true,
                base_url,
                executable_path,
                executable_found,
                model_path,
                model_found,
                error: None,
            },
            None => match self
                .client
                .get(format!("{}/v1/models", self.base_url))
                .timeout(Duration::from_secs(5))
                .send()
                .await
            {
            Ok(response) if response.status().is_success() => DirectEngineStatus {
                running: true,
                base_url: self.base_url.clone(),
                executable_path,
                executable_found,
                model_path,
                model_found,
                error: None,
            },
            Ok(response) => DirectEngineStatus {
                running: false,
                base_url: self.base_url.clone(),
                executable_path,
                executable_found,
                model_path,
                model_found,
                error: Some(format!("Unexpected status: {}", response.status())),
            },
            Err(error) => DirectEngineStatus {
                running: false,
                base_url: self.base_url.clone(),
                executable_path,
                executable_found,
                model_path,
                model_found,
                error: Some(error.to_string()),
            },
            },
        }
    }

    pub async fn list_models(
        &self,
        settings: Option<&DirectEngineSettings>,
    ) -> Result<Vec<Model>, String> {
        let mut merged = BTreeMap::new();
        let mut local_models = discover_local_models(settings);

        for model in local_models.drain(..) {
            merged.insert(model.name.clone(), model);
        }

        if let Ok(served_models) = self.fetch_served_models().await {
            for model in served_models {
                merged
                    .entry(model.name.clone())
                    .and_modify(|existing| {
                        existing.served = true;
                        existing.source = "served+local".to_string();
                    })
                    .or_insert(model);
            }
        }

        Ok(merged.into_values().collect())
    }

    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<ChatMessage>,
    ) -> Result<ChatResponse, String> {
        let prepared_messages = prepare_messages_for_request(messages)?;
        let started_at = Instant::now();
        let base_url = self
            .resolve_base_url()
            .await
            .unwrap_or_else(|| self.base_url.clone());
        let response = self
            .client
            .post(format!("{}/v1/chat/completions", base_url))
            .json(&ChatCompletionRequest {
                model: model.to_string(),
                messages: prepared_messages,
                stream: false,
            })
            .send()
            .await
            .map_err(|error| format!("Request failed: {}", error))?;

        if !response.status().is_success() {
            return Err(format!("Chat failed: {}", response.status()));
        }

        let completion: ChatCompletionResponse = response
            .json()
            .await
            .map_err(|error| format!("Parse error: {}", error))?;

        let ChatCompletionResponse {
            model,
            created,
            usage,
            choices,
        } = completion;

        let choice = choices
            .into_iter()
            .next()
            .ok_or_else(|| "Direct engine returned no completion choices.".to_string())?;
        let elapsed_ms = started_at.elapsed().as_millis().min(u64::MAX as u128) as u64;

        Ok(ChatResponse {
            model,
            created_at: created
                .map(|value| value.to_string())
                .unwrap_or_default(),
            message: choice.message,
            done: true,
            total_duration: Some(elapsed_ms),
            eval_count: usage.as_ref().and_then(|value| value.completion_tokens),
            prompt_eval_count: usage.as_ref().and_then(|value| value.prompt_tokens),
            finish_reason: choice.finish_reason,
        })
    }

    async fn fetch_served_models(&self) -> Result<Vec<Model>, String> {
        let base_url = self
            .resolve_base_url()
            .await
            .unwrap_or_else(|| self.base_url.clone());
        let response = self
            .client
            .get(format!("{}/v1/models", base_url))
            .send()
            .await
            .map_err(|error| format!("Request failed: {}", error))?;

        if !response.status().is_success() {
            return Err(format!("Failed to list models: {}", response.status()));
        }

        let envelope: ModelsEnvelope = response
            .json()
            .await
            .map_err(|error| format!("Parse error: {}", error))?;

        Ok(envelope
            .data
            .into_iter()
            .map(|model| Model {
                name: canonical_alias_for_name(&model.id),
                modified_at: model.created.map(|value| value.to_string()).unwrap_or_default(),
                size: 0,
                digest: String::new(),
                details: ModelDetails::default(),
                path: None,
                source: "served".to_string(),
                served: true,
            })
            .collect())
    }

    async fn resolve_base_url(&self) -> Option<String> {
        for base_url in direct_engine_base_urls() {
            match self
                .client
                .get(format!("{}/v1/models", base_url))
                .timeout(Duration::from_secs(3))
                .send()
                .await
            {
                Ok(response) if response.status().is_success() => return Some(base_url.to_string()),
                _ => continue,
            }
        }

        None
    }
}

fn direct_engine_base_urls() -> [&'static str; 2] {
    [DIRECT_ENGINE_BASE_URL, DIRECT_ENGINE_FALLBACK_BASE_URL]
}

fn prepare_messages_for_request(messages: Vec<ChatMessage>) -> Result<Vec<ChatMessage>, String> {
    messages
        .into_iter()
        .map(|message| {
            if message.images.is_empty() {
                return Ok(message);
            }

            let mut content = message.content;
            for path in &message.images {
                let bytes = fs::read(path)
                    .map_err(|error| format!("Failed to read image {}: {}", path, error))?;
                let encoded = STANDARD.encode(bytes);
                content.push_str("\n\n[image:data:image;base64,");
                content.push_str(&encoded);
                content.push(']');
            }

            Ok(ChatMessage {
                role: message.role,
                content,
                images: Vec::new(),
            })
        })
        .collect()
}

pub fn discover_local_models(settings: Option<&DirectEngineSettings>) -> Vec<Model> {
    let roots = discover_model_roots(settings);
    let configured_path = settings
        .and_then(|value| value.model_path.as_ref())
        .map(PathBuf::from);

    let mut candidate_roots = roots.clone();

    if let Some(path) = configured_path.clone() {
        if path.is_file() {
            if let Some(parent) = path.parent() {
                candidate_roots.push(parent.to_path_buf());
            }
        } else if path.is_dir() {
            candidate_roots.push(path);
        }
    }

    let mut seen_paths = HashSet::new();
    let mut models = Vec::new();

    for root in candidate_roots {
        for path in collect_gguf_files(&root) {
            let normalized = path.to_string_lossy().to_string();
            if !seen_paths.insert(normalized.clone()) {
                continue;
            }

            if let Ok(metadata) = fs::metadata(&path) {
                let filename = path
                    .file_stem()
                    .and_then(|value| value.to_str())
                    .unwrap_or("unknown-model");

                let alias = canonical_alias_for_name(filename);
                let is_configured = configured_path
                    .as_ref()
                    .map(|value| same_path(value, &path))
                    .unwrap_or(false);

                models.push(Model {
                    name: alias,
                    modified_at: metadata
                        .modified()
                        .ok()
                        .and_then(|value| value.elapsed().ok())
                        .map(|value| format!("{}s ago", value.as_secs()))
                        .unwrap_or_default(),
                    size: metadata.len(),
                    digest: String::new(),
                    details: ModelDetails {
                        format: Some("GGUF".to_string()),
                        family: infer_model_family(filename),
                        parameter_size: infer_parameter_size(filename),
                        quantization_level: infer_quantization(filename),
                    },
                    path: Some(path.to_string_lossy().to_string()),
                    source: if is_configured {
                        "configured-local".to_string()
                    } else {
                        "local".to_string()
                    },
                    served: false,
                });
            }
        }
    }

    models.sort_by(|left, right| left.name.cmp(&right.name));
    models
}

pub fn resolve_preferred_model_path(settings: Option<&DirectEngineSettings>) -> Option<PathBuf> {
    let configured_path = settings
        .and_then(|value| value.model_path.as_ref())
        .map(PathBuf::from)
        .filter(|path| path.is_file());

    if configured_path.is_some() {
        return configured_path;
    }

    let models = discover_local_models(settings);
    let preferred_names = ["google/gemma-4-e4b", "gemma4:e4b"];

    for preferred_name in preferred_names {
        if let Some(path) = models
            .iter()
            .find(|model| model.name.eq_ignore_ascii_case(preferred_name))
            .and_then(|model| model.path.as_ref())
        {
            return Some(PathBuf::from(path));
        }
    }

    models
        .into_iter()
        .find_map(|model| model.path.map(PathBuf::from))
}

pub fn resolve_executable_path(settings: Option<&DirectEngineSettings>) -> Option<PathBuf> {
    let configured = settings
        .and_then(|value| value.executable_path.as_ref())
        .filter(|value| !value.trim().is_empty())
        .map(PathBuf::from);

    let mut candidates = Vec::new();
    if let Some(path) = configured.clone() {
        candidates.push(path);
    }

    if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
        let local_app_data = PathBuf::from(local_app_data);
        candidates.push(
            local_app_data
                .join("Microsoft")
                .join("WinGet")
                .join("Packages")
                .join("ggml.llamacpp_Microsoft.Winget.Source_8wekyb3d8bbwe")
                .join("llama-server.exe"),
        );
        candidates.push(
            local_app_data
                .join("ModernClaw")
                .join("tools")
                .join("llama.cpp")
                .join("llama-server.exe"),
        );
    }

    candidates
        .into_iter()
        .find(|path| path.is_file())
        .or(configured)
}

fn discover_model_roots(settings: Option<&DirectEngineSettings>) -> Vec<PathBuf> {
    let mut roots = Vec::new();

    if let Some(path) = settings
        .and_then(|value| value.model_path.clone())
        .filter(|value| !value.trim().is_empty())
    {
        let path = PathBuf::from(path);
        if path.is_dir() {
            roots.push(path);
        } else if let Some(parent) = path.parent() {
            roots.push(parent.to_path_buf());
        }
    }

    if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
        roots.push(PathBuf::from(local_app_data).join("ModernClaw").join("models"));
    }

    roots.extend(discover_managed_cache_roots());

    roots
}

fn discover_managed_cache_roots() -> Vec<PathBuf> {
    let Some(user_profile) = std::env::var_os("USERPROFILE") else {
        return Vec::new();
    };

    let cache_root = PathBuf::from(user_profile)
        .join(".cache")
        .join("huggingface")
        .join("hub");

    let candidates = [
        cache_root
            .join("models--ggml-org--gemma-4-E4B-it-GGUF")
            .join("snapshots"),
    ];

    candidates
        .into_iter()
        .filter(|path| path.exists())
        .collect()
}

fn collect_gguf_files(root: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    if !root.exists() {
        return files;
    }

    let mut stack = vec![root.to_path_buf()];
    while let Some(path) = stack.pop() {
        let entries = match fs::read_dir(&path) {
            Ok(entries) => entries,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                stack.push(entry_path);
                continue;
            }

            let is_gguf = entry_path
                .extension()
                .and_then(|value| value.to_str())
                .map(|value| value.eq_ignore_ascii_case("gguf"))
                .unwrap_or(false);

            let is_mmproj = entry_path
                .file_name()
                .and_then(|value| value.to_str())
                .map(|value| value.to_lowercase().contains("mmproj"))
                .unwrap_or(false);

            if is_gguf && !is_mmproj {
                files.push(entry_path);
            }
        }
    }

    files
}

pub fn infer_alias_from_path(path: &Path) -> Option<String> {
    let filename = path.file_stem()?.to_string_lossy().to_lowercase();
    if filename.contains("gemma-4-e4b") || filename.contains("gemma4-e4b") {
        return Some("google/gemma-4-e4b".to_string());
    }

    None
}

pub fn managed_model_spec_for_name(name: &str) -> Option<ManagedModelSpec> {
    let normalized = name
        .trim()
        .replace('\\', "/")
        .replace('_', "-")
        .to_lowercase();

    if normalized.contains("gemma-4-e4b")
        || normalized.contains("gemma4-e4b")
        || normalized.contains("gemma4:e4b")
    {
        return Some(ManagedModelSpec {
            alias: "google/gemma-4-e4b",
            hf_repo: "ggml-org/gemma-4-E4B-it-GGUF",
            launch_label: "Managed Gemma 4 E4B from ggml-org/gemma-4-E4B-it-GGUF",
        });
    }

    None
}

pub fn canonical_alias_for_name(name: &str) -> String {
    let normalized = name
        .trim()
        .replace('\\', "/")
        .replace(".gguf", "")
        .replace('_', "-")
        .to_lowercase();

    if normalized.contains("gemma-4-e4b")
        || normalized.contains("gemma4-e4b")
        || normalized.contains("gemma4:e4b")
    {
        return "google/gemma-4-e4b".to_string();
    }

    name.trim().to_string()
}

fn infer_model_family(name: &str) -> Option<String> {
    let lower = name.to_lowercase();
    if lower.contains("gemma") {
        return Some("Gemma".to_string());
    }

    if lower.contains("llama") {
        return Some("Llama".to_string());
    }

    None
}

fn infer_parameter_size(name: &str) -> Option<String> {
    let lower = name.to_lowercase();
    if lower.contains("e4b") || lower.contains("4b") {
        return Some("4B class".to_string());
    }

    if lower.contains("e2b") || lower.contains("2b") {
        return Some("2B class".to_string());
    }

    None
}

fn infer_quantization(name: &str) -> Option<String> {
    let lower = name.to_lowercase();
    for marker in ["q2", "q3", "q4", "q5", "q6", "q8", "iq"] {
        if lower.contains(marker) {
            return Some(marker.to_uppercase());
        }
    }

    None
}

fn same_path(left: &Path, right: &Path) -> bool {
    let left = left.to_string_lossy().to_lowercase();
    let right = right.to_string_lossy().to_lowercase();
    left == right
}
