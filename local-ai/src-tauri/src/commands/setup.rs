use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

use reqwest::Client;
use tauri::State;
use tokio::time::sleep;

use crate::services::direct_engine::{
    infer_alias_from_path, managed_model_spec_for_name, resolve_executable_path,
    resolve_preferred_model_path,
};
use crate::types::DirectEngineSettings;
use crate::DatabaseState;

const DIRECT_ENGINE_BASE_URL: &str = "http://127.0.0.1:8080";
const DIRECT_ENGINE_FALLBACK_BASE_URL: &str = "http://127.0.0.1:8081";
const DEFAULT_CONTEXT_WINDOW_SIZE: usize = 32_768;

fn decode_setting_string(value: Option<String>) -> Option<String> {
    value.and_then(|raw| serde_json::from_str::<String>(&raw).ok().or(Some(raw)))
}

fn decode_setting_usize(value: Option<String>) -> Option<usize> {
    value.and_then(|raw| serde_json::from_str::<usize>(&raw).ok().or_else(|| raw.parse::<usize>().ok()))
}

fn load_direct_engine_settings(db_state: &DatabaseState) -> Result<DirectEngineSettings, String> {
    Ok(DirectEngineSettings {
        executable_path: decode_setting_string(db_state.db.get_setting("directEngineExecutablePath")?),
        model_path: decode_setting_string(db_state.db.get_setting("directEngineModelPath")?),
        default_model: decode_setting_string(db_state.db.get_setting("defaultModel")?),
        context_window_size: decode_setting_usize(db_state.db.get_setting("contextWindowSize")?),
    })
}

fn resolve_model_path(settings: &DirectEngineSettings) -> Option<PathBuf> {
    settings
        .model_path
        .as_ref()
        .filter(|value| !value.trim().is_empty())
        .map(PathBuf::from)
        .filter(|path| path.is_file())
        .or_else(|| resolve_preferred_model_path(Some(settings)))
}

fn find_mmproj_path(model_path: &Path) -> Option<PathBuf> {
    let parent = model_path.parent()?;
    let stem = model_path.file_stem()?.to_string_lossy().to_lowercase();

    let entries = fs::read_dir(parent).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };

        let lower = name.to_lowercase();
        if lower.contains("mmproj") && (lower.contains(&stem) || stem.contains("vision")) {
            return Some(path);
        }
    }

    None
}

async fn wait_for_direct_engine() -> Result<(), String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|error| format!("Failed to create readiness client: {}", error))?;

    for _ in 0..900 {
        for base_url in [DIRECT_ENGINE_BASE_URL, DIRECT_ENGINE_FALLBACK_BASE_URL] {
            match client.get(format!("{}/v1/models", base_url)).send().await {
                Ok(response) if response.status().is_success() => return Ok(()),
                _ => {}
            }
        }

        sleep(Duration::from_millis(1000)).await;
    }

    Err("Direct engine did not come online at http://127.0.0.1:8080 or http://127.0.0.1:8081.".to_string())
}

#[tauri::command]
pub async fn setup_open_external(target: String) -> Result<(), String> {
    let trimmed = target.trim();
    if trimmed.is_empty() {
        return Err("No external target was provided.".to_string());
    }

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = Command::new("cmd");
        command.arg("/C").arg("start").arg("").arg(trimmed);
        command
    };

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut command = Command::new("open");
        command.arg(trimmed);
        command
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut command = Command::new("xdg-open");
        command.arg(trimmed);
        command
    };

    command
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| format!("Failed to open external target: {}", error))?;

    Ok(())
}

#[tauri::command]
pub async fn setup_start_direct_engine(
    db_state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let settings = load_direct_engine_settings(&db_state)?;
    let executable_path = resolve_executable_path(Some(&settings))
        .ok_or_else(|| "Set a llama-server executable path before starting the direct engine.".to_string())?;
    let managed_model = settings
        .default_model
        .as_deref()
        .and_then(managed_model_spec_for_name);
    let model_path = resolve_model_path(&settings);

    if model_path.is_none() && managed_model.is_none() {
        return Err(
            "Choose a supported Gemma 4 workspace model or provide an advanced GGUF override before starting the direct engine."
                .to_string(),
        );
    }

    if settings
        .model_path
        .as_ref()
        .map(|value| value.trim().is_empty())
        .unwrap_or(true)
    {
        if let Some(model_path) = model_path.as_ref() {
            let _ = db_state
                .db
                .set_setting(
                    "directEngineModelPath",
                    &serde_json::to_string(&model_path.to_string_lossy().to_string())
                        .unwrap_or_else(|_| format!("\"{}\"", model_path.to_string_lossy())),
                );
        }
    }

    if !executable_path.is_file() {
        return Err(format!(
            "llama-server executable was not found at {}",
            executable_path.to_string_lossy()
        ));
    }

    if let Some(model_path) = model_path.as_ref() {
        if !model_path.is_file() {
            return Err(format!(
                "GGUF model file was not found at {}",
                model_path.to_string_lossy()
            ));
        }
    }

    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("taskkill")
            .arg("/IM")
            .arg("llama-server.exe")
            .arg("/F")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();

        sleep(Duration::from_millis(1200)).await;
    }

    let mut command = Command::new(&executable_path);
    command
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg("8080")
        .arg("--ctx-size")
        .arg(
            settings
                .context_window_size
                .unwrap_or(DEFAULT_CONTEXT_WINDOW_SIZE)
                .to_string(),
        )
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    if let Some(model_path) = model_path.as_ref() {
        command.arg("-m").arg(model_path);

        if let Some(mmproj_path) = find_mmproj_path(model_path) {
            command.arg("--mmproj").arg(mmproj_path);
        }

        if let Some(alias) = infer_alias_from_path(model_path) {
            command.arg("--alias").arg(alias);
        }
    } else if let Some(spec) = managed_model {
        command
            .arg("--hf-repo")
            .arg(spec.hf_repo)
            .arg("--alias")
            .arg(spec.alias)
            .arg("--jinja");
    }

    command
        .spawn()
        .map_err(|error| format!("Failed to start direct engine: {}", error))?;

    wait_for_direct_engine().await
}

#[tauri::command]
pub async fn setup_stop_direct_engine() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("taskkill")
            .arg("/IM")
            .arg("llama-server.exe")
            .arg("/F")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map_err(|error| format!("Failed to stop direct engine: {}", error))?;

        if output.success() {
            return Ok(());
        }

        return Err("taskkill did not report a successful stop for llama-server.exe".to_string());
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Direct engine stop is only implemented for Windows in this build.".to_string())
    }
}
