# RUNBOOK

## Purpose

This runbook records the bring-up, recovery, and basic verification steps for the ModernClaw base workspace.

## Current Workspace

- Repo root: `C:\Users\pento\Desktop\ModernClawBase`
- App source: `C:\Users\pento\Desktop\ModernClawBase\local-ai`

## Daily Bring-Up

1. Make sure Ollama is installed.
2. Start Ollama if it is not already running.
3. Start the app in Tauri dev mode.

### Commands

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai"
npm run tauri:dev
```

If Ollama is not already running, start it in a separate PowerShell window:

```powershell
ollama serve
```

## Build Verification

### Frontend + TypeScript

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai"
npm run build
```

### Rust / Tauri Backend

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai\src-tauri"
cargo check
```

## Packaged Build

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai"
npm run tauri:build
```

## Common Recovery Steps

### App folder was renamed or moved

If Tauri build paths or generated artifacts look stale:

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai\src-tauri"
cargo clean
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai"
npm run tauri:dev
```

### Sidebar appears lost

If the app gets into a strange UI state, restart dev mode.

## Voice Setup Notes

### Current Voice Features

Working now:

- local voice output through Piper
- local voice input through Whisper
- microphone-recorded audio notes with Whisper transcription
- dropped or picker-selected audio files can be attached, transcribed, and rendered back in chat history
- pause, resume, and stop playback controls
- shared machine-level tool paths with workspace-level voice preferences

### Current Audio-Note Behavior

- audio notes are normalized to `.wav` before Whisper transcription
- saved audio files are copied into `attachments/` under the active workspace
- the transcript text is appended to the user message content that is sent to the model
- the original audio attachment remains available in conversation history for playback

### Current Default Voice Tool Layout

The app provisions shared folders under the LocalAI app-data root:

- `%APPDATA%\LocalAI\tools\piper\`
- `%APPDATA%\LocalAI\tools\piper\voices\`
- `%APPDATA%\LocalAI\tools\whisper\`
- `%APPDATA%\LocalAI\tools\whisper\models\`

Important current limitation:

- the folders are auto-created
- Piper and Whisper executables and model files are not auto-downloaded yet
- clean-machine setup still requires manual dependency placement or installation

### Current Validated Piper Setup

- Piper executable: `C:\Tools\piper\piper.exe`
- Amy model: `%APPDATA%\LocalAI\tools\piper\voices\en_US-amy-medium.onnx`
- Amy metadata: `%APPDATA%\LocalAI\tools\piper\voices\en_US-amy-medium.onnx.json`
- Joe model: `%APPDATA%\LocalAI\tools\piper\voices\en_US-joe-medium.onnx`
- Joe metadata: `%APPDATA%\LocalAI\tools\piper\voices\en_US-joe-medium.onnx.json`

### Current Validated Whisper Setup

- Whisper executable: `C:\Tools\whisper\release\whisper-cli.exe`
- Whisper model: `%APPDATA%\LocalAI\tools\whisper\models\ggml-base.en.bin`

## Workspace / Curator Notes

- Brain data loads from the current local workspace managed by the app.
- Curator staged packages are read from `curator/staged/` under the active workspace path.
- Packages added outside the app appear in the Curator Inbox after refresh.
- The external Cowork automation setup is documented in [COWORK_CURATOR_AUTOMATION_SPEC.md](C:/Users/pento/Desktop/ModernClawBase/COWORK_CURATOR_AUTOMATION_SPEC.md) so it can be rebuilt if the scheduled task is lost.

### Shared Workspace Path

Important current behavior:

- the base runtime keeps `Main Workspace` and built-in `Joe Support` on the same LocalAI workspace root
- Curator staged packages are read from `curator/staged/` under that shared root
- imports into `knowledge/` use the same shared root

Practical rule for automation:

- Curator automation should target the top-level LocalAI workspace root used by the base app
- do not build new base-only tooling around per-brain workspace folders
- if fuller multi-product work returns later, revisit workspace-path assumptions there instead of reintroducing them into base

## Local Data Location

The app uses the `LocalAI` app-data root for runtime files, including:

- `SOUL.md`
- `USER.md`
- `MEMORY.md`
- `memory/`
- `knowledge/`
- `curator/`
- `tools/`

When managed agent workspaces are in use, active runtime files may instead live under:

- fuller multi-product compatibility paths outside the intended base runtime

## Current Model Stack

- primary tested baseline: `gemma4:e4b`
