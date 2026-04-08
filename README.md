# ModernClawBase

ModernClawBase is a free, open-source, local-first desktop workspace for building and using durable AI context on your own machine.

The product is intentionally focused:

- one local workspace
- one chat surface
- one editable memory scaffold
- one Brain-guided refinement flow
- one clear model lane centered on `gemma4:e4b`
- one practical local voice pipeline

## What It Includes

- local chat with Ollama
- persistent conversation history
- editable `SOUL.md`, `USER.md`, and `MEMORY.md`
- daily logs in `memory/YYYY-MM-DD.md`
- flat `knowledge/*.md` prompt-context loading
- Brain suggestions and guided setup
- curator review for staged knowledge packages
- local voice output through Piper
- local voice input through Whisper
- onboarding, settings, and storage visibility

## Product Shape

ModernClawBase is meant to be useful on its own.

It keeps the core ModernClaw identity:

- local-first
- durable Markdown context files
- grounded knowledge files
- practical chat plus memory workflows
- approachable setup and settings

## Repository Layout

- `local-ai/`: Tauri app source
- `KNOWLEDGE_PACK_MODERNCLAW/`: reference knowledge-pack folder
- `MODERNCLAW_BASE_SPLIT_PLAN.md`: product scope and repo discipline document
- `RUNBOOK.md`: bring-up and verification notes
- `SUGGESTION_SYSTEM_SPEC.md`: Brain suggestion workflow spec

## Technology Stack

- Tauri
- React
- TypeScript
- Rust
- SQLite
- Ollama
- Piper
- Whisper

## Local Data Model

Runtime workspace files live under the LocalAI app-data root and include:

- `SOUL.md`
- `USER.md`
- `MEMORY.md`
- `memory/`
- `knowledge/`
- `curator/`
- `tools/`

The backend still keeps a compatibility-friendly internal structure, but the live product presents a single local workspace.

## Requirements

To run the app locally you currently need:

- Node.js
- Rust toolchain
- Ollama installed and running
- a supported local model available in Ollama

For voice features you also need:

- Piper installed or placed in the expected machine-level path
- Whisper installed or placed in the expected machine-level path
- required Piper voice files
- required Whisper model files

## Development

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai"
npm install
npm run tauri:dev
```

## Build Commands

```powershell
cd "C:\Users\pento\Desktop\ModernClawBase\local-ai"
npm run build
npm run tauri:build
```

## Current Limits

- Windows is the validated platform today
- Ollama remains an external dependency
- Piper and Whisper dependency delivery is still manual on a clean machine
- knowledge files are loaded directly rather than selectively retrieved
- daily logs are user-written notes, not automatic summaries

## Direction

The current priority is to keep ModernClawBase simple, stable, and trustworthy.

That means:

- polishing the single-workspace experience
- keeping documentation disciplined
- improving clarity before adding more surface area
