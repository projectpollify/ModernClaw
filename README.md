# ModernClaw

ModernClaw is a free, open-source, local-first desktop workspace for building and using durable AI context on your own machine.

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
- drag-drop or picker-based image understanding in chat
- editable `SOUL.md`, `USER.md`, and `MEMORY.md`
- daily logs in `memory/YYYY-MM-DD.md`
- flat `knowledge/*.md` prompt-context loading
- Brain suggestions and guided setup
- setup-readiness checks with required vs optional items
- curator review for staged knowledge packages
- local voice output through Piper
- local voice input through Whisper
- audio-note attachments with Whisper transcription
- built-in Joe Support for setup, troubleshooting, and product guidance
- onboarding, settings, and storage visibility

## Product Shape

ModernClaw is meant to be useful on its own.

It keeps the core ModernClaw identity:

- local-first
- durable Markdown context files
- grounded knowledge files
- one clear setup story
- practical chat plus memory workflows
- approachable setup and settings

## Repository Layout

- `local-ai/`: Tauri app source
- `OVERVIEW.md`: plain-language product summary
- `SOURCE_SUMMARIES/`: comparison and reference writeups created during product research
- `KNOWLEDGE_PACK_MODERNCLAW/`: reference knowledge-pack folder
- `MODERNCLAW_BASE_SPLIT_PLAN.md`: product scope and repo discipline document
- `RUNBOOK.md`: bring-up and verification notes
- `COWORK_CURATOR_AUTOMATION_SPEC.md`: rebuild guide for the external Curator automation
- `COWORK_CURATOR_TASK_PROMPT.md`: copyable prompt for recreating the Curator scheduled task
- `CURATOR_INTAKE_INTERPRETER_SPEC.md`: one-box intake model for Curator
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
- `attachments/`
- `tools/`

Important current detail:

- the base app now treats `Main Workspace` and built-in `Joe Support` as shared-workspace profiles rather than separate user-managed brains
- memory, knowledge, curator, attachments, and tools all stay rooted in the same local workspace path
- external automation that prepares curator packages should target the main LocalAI workspace root

The backend still carries profile-aware compatibility structure, but the base runtime now treats it as one user workspace plus built-in Joe Support rather than generic hidden multi-brain behavior.

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

## Setup And Multimodal Status

Current setup behavior:

- onboarding ends with a shared setup checklist
- the sidebar includes a dedicated `Setup` surface
- chat shows an attention banner when required setup is incomplete
- required setup covers Ollama, installed model availability, and workspace files
- voice input and output are treated as optional features

Current multimodal behavior:

- chat accepts image and audio attachments through drag-drop or the file picker
- chat can record microphone audio notes, transcribe them with Whisper, and attach the saved `.wav` file to the message
- image and audio attachments are copied into the active workspace under `attachments/`
- audio-note transcripts are added to the user message content before the model request is built
- conversation history stores attachment metadata and file paths rather than binary blobs
- the Ollama request only base64-encodes images at send time

## Development

```powershell
cd "C:\path\to\ModernClaw\local-ai"
npm install
npm run tauri:dev
```

## Build Commands

```powershell
cd "C:\path\to\ModernClaw\local-ai"
npm run build
npm run tauri:build
```

## Current Limits

- Windows is the validated platform today
- Ollama remains an external dependency
- Piper and Whisper dependency delivery is still manual on a clean machine
- knowledge files are loaded directly rather than selectively retrieved
- daily logs are user-written notes, not automatic summaries
- audio-note prompts currently reach the model through transcript text rather than direct audio understanding

## Direction

The current priority is to keep ModernClaw simple, stable, and trustworthy.

That means:

- polishing the single-workspace experience
- keeping Joe Support built in without turning base back into generic multi-brain management
- making setup easier to understand on a clean machine
- improving multimodal support in small, legible slices, including the new audio-note path
- keeping documentation disciplined before adding more surface area
