# ModernClaw

ModernClaw is easy local private AI: a desktop workspace for people who want help, not homework.

It runs on your own machine, keeps your data local, and gives you a clear workspace that feels approachable from the first launch. The source code is public under the Apache License 2.0, and the packaged core local app is being positioned as a simple one-time purchase: $10 early access, with a planned $25 regular price later.

The core local app is intentionally focused:

- one local workspace
- one chat surface
- one editable memory scaffold
- one Brain-guided refinement flow
- one clear model lane centered on `gemma4:e4b`
- one practical local voice pipeline

The core local experience does not require a subscription or per-message API costs. Optional premium brains and enterprise editions may come later, but they are not required for the base local workspace.

Website: [modernclaw.ai](https://modernclaw.ai)

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

- easy local private AI
- local-first
- durable Markdown context files
- grounded knowledge files
- one clear setup story
- practical chat plus memory workflows
- approachable setup and settings

## Pricing And Editions

The public landing page currently positions ModernClaw this way:

- early access core app: $10 once
- planned regular core app price later: $25 once
- no subscription required for the core local app
- no per-message API costs required for local use
- optional premium brains and enterprise editions may come later

The GitHub source remains open under the Apache License 2.0. The paid offer is about packaged access, convenience, support, and continued development of the core desktop product.

## Repository Layout

- `local-ai/`: Tauri app source
- `.github/`: workflows, issue templates, and PR template
- `docs/product/`: product overview, progress, split plan, and future implementation plans
- `docs/runbooks/`: bring-up, validation, and operating notes
- `docs/automation/`: Curator and external automation specs
- `docs/verification/`: Rosie verification materials
- `docs/research/`: source summaries and comparison material

## Contributing

If you want to contribute or set up the project as a developer, start here:

- [CONTRIBUTING.md](CONTRIBUTING.md): development setup, validation steps, and PR expectations
- [SUPPORT.md](SUPPORT.md): setup help and where to file different kinds of issues
- [SECURITY.md](SECURITY.md): how to report vulnerabilities responsibly
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): collaboration standards for the project
- [docs/runbooks/RUNBOOK.md](docs/runbooks/RUNBOOK.md): bring-up and clean-machine validation
- [docs/product/PROGRESS.md](docs/product/PROGRESS.md): current execution focus and open questions

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

## Fresh Install

This is the intended clean-machine path for the current repo on Windows.

### 1. Install Base Dependencies

Install these first:

- Node.js
- Rust toolchain via `rustup`

Then install Ollama:

- from [ollama.com/download](https://ollama.com/download)
- or from the in-app `Download Ollama` action after the app is running

Important current scope:

- Windows is the validated platform today
- voice features are optional and can be skipped during first install
- Piper and Whisper are still manual setup on a clean machine

### 2. Clone The Repo

```powershell
git clone https://github.com/projectpollify/ModernClaw.git
cd "C:\path\to\ModernClaw\local-ai"
```

### 3. Install App Dependencies

```powershell
npm install
```

### 4. Launch The App

```powershell
npm run tauri:dev
```

### 5. Follow The In-App Setup Flow

After the app opens, use onboarding or the `Setup` page and follow the required steps in this order:

1. Get Ollama running.
2. Install the recommended model, currently `gemma4:e4b`.
3. Confirm the workspace files are initialized.

Current in-app helpers:

- `Download Ollama` opens the Ollama site
- `Start Ollama` tries to launch the local service
- `Install Recommended Model` downloads the default supported Gemma 4 lane
- `Initialize Workspace` creates `SOUL.md`, `USER.md`, and `MEMORY.md`

### 6. Confirm Core Setup Is Ready

Core setup is ready when:

- Ollama shows as running
- at least one local model is installed
- workspace files are ready

Voice input and output can stay optional for the first pass.

## Setup And Multimodal Status

Current setup behavior:

- onboarding ends with a shared setup checklist
- the sidebar includes a dedicated `Setup` surface
- chat shows an attention banner when required setup is incomplete
- required setup covers Ollama, installed model availability, and workspace files
- setup surfaces now highlight the single next required action for the machine
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
