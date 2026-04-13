# RUNBOOK

## Purpose

This runbook records the bring-up, recovery, and basic verification steps for the ModernClaw base workspace.

## Daily Bring-Up

1. Make sure Ollama is installed.
2. Start the app in Tauri dev mode.
3. Use onboarding or the `Setup` page to confirm the next required action.
4. If Ollama is not running yet, use the in-app `Start Ollama` action first.
5. If no model is installed yet, use the in-app `Install Recommended Model` action.
6. Confirm workspace files are ready before normal chat use.

### Commands

```powershell
cd "C:\path\to\ModernClaw\local-ai"
npm run tauri:dev
```

If the in-app `Start Ollama` action does not bring Ollama up, start it manually in a separate PowerShell window:

```powershell
ollama serve
```

## Fresh Install Flow

This is the current intended repo-to-running-app path on a clean Windows machine.

1. Install Node.js.
2. Install the Rust toolchain with `rustup`.
3. Install Ollama from [ollama.com/download](https://ollama.com/download), or use the in-app `Download Ollama` action once the app is running.
4. Clone the repo.
5. Run `npm install` in `local-ai`.
6. Run `npm run tauri:dev`.
7. In onboarding or `Setup`, get Ollama running.
8. Install the recommended model, currently `gemma4:e4b`.
9. Confirm the workspace files are initialized.
10. Open chat once the required setup summary is fully ready.

Current scope:

- Windows is the validated platform
- voice can be skipped for first install
- Piper and Whisper still require manual setup on a clean machine

## Clean-Machine Validation

Use this exact validation flow when testing install readiness from the repo.

### Test Goal

A tester should be able to clone the repo, follow the docs, and reach normal chat use without hidden setup knowledge.

### Validation Steps

1. Start from a clean Windows machine or VM.
2. Install Node.js and Rust only.
3. Clone the repo into a fresh folder.
4. Open `README.md` and follow only the documented install steps.
5. Run `npm install`.
6. Run `npm run tauri:dev`.
7. Let onboarding guide the machine through setup.
8. If Ollama is missing, use `Download Ollama` or manually install it from the documented URL.
9. Use `Start Ollama`.
10. Use `Install Recommended Model`.
11. Confirm `SOUL.md`, `USER.md`, and `MEMORY.md` are created.
12. Reach the chat screen and send a normal text prompt.

### Pass Criteria

- the tester does not need extra verbal guidance beyond repo docs
- the app makes the next required step obvious
- Ollama startup is understandable even if the first automatic launch attempt fails
- model installation is obvious from onboarding or `Setup`
- workspace initialization completes without manual file creation
- chat works after required setup is green

### Failure Signals

- the tester has to guess what to do next
- the tester has to open code or inspect source files to continue
- the docs skip a required dependency or command
- the app reports a blocker but does not point to a usable next action
- the tester cannot tell whether setup is complete

## Build Verification

### Frontend + TypeScript

```powershell
cd "C:\path\to\ModernClaw\local-ai"
npm run build
```

### Rust / Tauri Backend

```powershell
cd "C:\path\to\ModernClaw\local-ai\src-tauri"
cargo check
```

## Packaged Build

```powershell
cd "C:\path\to\ModernClaw\local-ai"
npm run tauri:build
```

## Common Recovery Steps

### App folder was renamed or moved

If Tauri build paths or generated artifacts look stale:

```powershell
cd "C:\path\to\ModernClaw\local-ai\src-tauri"
cargo clean
cd "C:\path\to\ModernClaw\local-ai"
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

### Example Validated Windows Piper Setup

- Piper executable: `C:\Tools\piper\piper.exe`
- Amy model: `%APPDATA%\LocalAI\tools\piper\voices\en_US-amy-medium.onnx`
- Amy metadata: `%APPDATA%\LocalAI\tools\piper\voices\en_US-amy-medium.onnx.json`
- Joe model: `%APPDATA%\LocalAI\tools\piper\voices\en_US-joe-medium.onnx`
- Joe metadata: `%APPDATA%\LocalAI\tools\piper\voices\en_US-joe-medium.onnx.json`

These paths are examples from a validated Windows setup, not required fixed install locations.

### Example Validated Windows Whisper Setup

- Whisper executable: `C:\Tools\whisper\release\whisper-cli.exe`
- Whisper model: `%APPDATA%\LocalAI\tools\whisper\models\ggml-base.en.bin`

## Workspace / Curator Notes

- Brain data loads from the current local workspace managed by the app.
- Curator staged packages are read from `curator/staged/` under the active workspace path.
- Packages added outside the app appear in the Curator Inbox after refresh.
- The external Cowork automation setup is documented in [COWORK_CURATOR_AUTOMATION_SPEC.md](../automation/COWORK_CURATOR_AUTOMATION_SPEC.md) so it can be rebuilt if the scheduled task is lost.

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

## Current Model Stack

- primary tested baseline: `gemma4:e4b`
