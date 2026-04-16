# RUNBOOK

## Purpose

This runbook records the bring-up, recovery, and basic verification steps for the Windows ModernClaw base workspace running the direct-engine path.

## Daily Bring-Up

1. Make sure `llama-server.exe` is available on the machine.
2. Make sure the official Gemma 4 4B model is installed for the managed Windows setup.
3. Start the app in Tauri dev mode.
4. Wait a few seconds for the boot-time direct-engine startup to complete.
5. Confirm the app reaches normal chat use without needing a manual `Start Direct Engine` click.
6. If this machine was migrated from an older setup and startup still looks stale, use the onboarding recovery flow below once, then restart the app.

### Commands

```powershell
cd "C:\path\to\ModernClaw\local-ai"
npm run tauri:dev
```

## Fresh Install Flow

This is the current intended repo-to-running-app path on a clean Windows machine.

1. Install Node.js.
2. Install the Rust toolchain with `rustup`.
3. Install `llama.cpp` so `llama-server.exe` is present on the machine.
4. Clone the repo.
5. Run `npm install` in `local-ai`.
6. Run `npm run tauri:dev`.
7. Complete onboarding.
8. Use the supported managed model lane: official Gemma 4 4B.
9. Confirm the workspace files are initialized.
10. Close the app once onboarding is complete.
11. Reopen the app and confirm the engine starts automatically without user input.
12. Open chat and send a normal text prompt.

Current scope:

- Windows is the validated platform
- ModernClaw base on Windows is a one-model direct-engine app
- the supported managed model lane is Gemma 4 4B
- if a migrated machine shows stale startup state, re-running onboarding once is the approved reset path
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
8. Install or select the supported Gemma 4 4B lane.
9. Confirm `SOUL.md`, `USER.md`, and `MEMORY.md` are created.
10. Close the app once onboarding finishes.
11. Reopen the app and confirm the engine starts on its own.
12. Reach the chat screen and send a normal text prompt.

### Pass Criteria

- the tester does not need extra verbal guidance beyond repo docs
- the app makes the next required step obvious
- direct-engine startup happens automatically after onboarding is complete
- model installation is obvious from onboarding or `Setup`
- workspace initialization completes without manual file creation
- chat works after required setup is green

### Failure Signals

- the tester has to guess what to do next
- the tester has to open code or inspect source files to continue
- the docs skip a required dependency or command
- the app still requires a manual engine-start click after onboarding and restart
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

### Startup shows `Direct Engine Offline` on a migrated machine

This was reproduced on a machine that had older saved setup state from previous installs and experiments.

Recovery path that worked:

1. Go through onboarding again, or use the in-app restart-onboarding flow.
2. Finish onboarding with the supported Gemma 4 4B lane.
3. Let the app reach chat once.
4. Close the app completely.
5. Reopen the app.

Expected result:

- the red startup warning is gone
- the direct engine starts automatically during boot
- the user no longer needs to click `Start Direct Engine`

Interpretation:

- this is a saved-state recovery issue first
- do not assume the executable or model install is broken until onboarding reset has been tried

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

- primary tested baseline: `google/gemma-4-e4b`
- Windows base currently documents a one-model setup only
