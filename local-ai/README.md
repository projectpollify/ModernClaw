# ModernClaw App

This is the current ModernClaw desktop application surface.

It is a local-first single-workspace app built around durable Markdown memory files, grounded knowledge files, local model-backed chat, and practical voice support.

## What The App Does

- local chat with Ollama models
- streamed assistant responses
- persistent conversation history stored locally
- editable `SOUL.md`, `USER.md`, and `MEMORY.md`
- daily logs stored in `memory/YYYY-MM-DD.md`
- knowledge files loaded from `knowledge/*.md`
- Brain suggestions and guided setup
- curator staging with import and reject actions
- local voice output through Piper
- local voice input through Whisper
- onboarding and settings flows

## Current Baseline

- single local workspace
- primary model lane: `gemma4:e4b`
- curated Piper voices: `Amy (Female)`, `Joe (Male)`

## Development

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai"
npm install
npm run tauri:dev
```

For the full Windows bring-up flow, see [RUNBOOK.md](../RUNBOOK.md).

## Build Commands

```powershell
# Frontend only
npm run build

# Tauri dev
npm run tauri:dev

# Production build for the current platform
npm run tauri:build
```

## Memory System

The app stores local Markdown context files under the LocalAI app-data memory folder, including:

- `SOUL.md`
- `USER.md`
- `MEMORY.md`
- daily logs in `memory/YYYY-MM-DD.md`
- knowledge references in `knowledge/*.md`
- curator staging folders in `curator/`
- shared voice tool folders in `tools/`

## Known Limitations

- Ollama is a required external dependency
- only Windows has been validated so far
- voice dependency delivery is still manual on clean machines
- knowledge files added outside the app appear after refresh
- curator packages added outside the app appear after refresh
- the app still uses the original `LocalAI` app-data root internally
