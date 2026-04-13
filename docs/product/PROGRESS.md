# PROGRESS.md

## Split Status

The `ModernClawBase` split is in progress and not complete.

The repo already presents as a focused single-workspace product, but the finished base edition is not ready yet.

## Completed So Far

- removed the multi-workspace selector and related create/delete flows from the live app
- simplified app initialization around one durable workspace
- flattened the Brain suggestion store to one workspace
- completed the latest manual `tauri:dev` QA phase across the current product surface
- validated the Curator request-to-stage-to-import loop end to end
- documented the external Cowork Curator automation setup so the scheduled task can be rebuilt from the repo
- added a visible chat character budget
- added thumbs up / thumbs down reply feedback with persistence
- added a small feedback summary view in Settings
- added `gemma4:e2b` as a lighter supported Gemma 4 option alongside the main lane
- added a reusable setup-readiness layer across onboarding, Settings, sidebar navigation, and chat
- added first-pass setup actions for clean-machine flow, including Ollama download/start helpers and direct recommended-model install from setup surfaces
- added image attachments with workspace-backed storage and conversation rendering
- added audio-note attachments with Whisper transcription, workspace-backed storage, and conversation rendering
- narrowed the hidden runtime profile layer to built-in Main Workspace and Joe Support profiles
- removed generic create/delete runtime hooks for user-managed brains from the base app path
- rewrote visible product copy around `workspace` instead of role-management language
- updated root docs to the ModernClawBase identity
- removed stale planning and summary docs that no longer matched the product

## Locked Decisions

- the split work so far has primarily removed the multi-Brain aspects of the app
- the base runtime is now being tightened around one user workspace plus built-in Joe Support
- curator remains part of the currently shipped product during the transition
- curator is not required to define the finished `ModernClawBase` product
- curator is intended to complete the fuller multi product once the base edition is ready
- Rosie stays out of the base runtime surface and remains an external-first verification lane for now
- documentation should describe transition state honestly until the split is finished

## Current Transition State

The current shipped app still includes:
- one local workspace
- one built-in Joe Support profile that shares the main workspace root
- chat with conversation history
- image prompts through attachments
- editable `SOUL.md`, `USER.md`, and `MEMORY.md`
- daily logs
- flat knowledge-file loading
- Brain suggestions and guided setup
- shared setup-readiness checks with required vs optional items
- curator staging and import flow
- local Piper output and Whisper input
- audio-note recording and audio-file attachments
- onboarding, settings, and storage visibility

This means the fuller product shape is still more complete than the unfinished base edition.

## Current Execution Focus

The current execution focus has shifted from broad QA and runtime seam cleanup to easy install, packaging clarity, and clean-machine setup.

What is now in place:
- one visible setup-readiness flow shared across onboarding, Setup, Settings, and chat
- one first-pass setup-action flow that can open Ollama download, attempt to start Ollama, and install the recommended Gemma 4 model
- one working image-understanding path that keeps files in the local workspace
- one working audio-note path that transcribes with Whisper, stores the attachment locally, and includes transcript text in the user prompt
- one built-in profile direction for base: Main Workspace plus Joe Support on the same workspace root

Immediate next focus:
- polish the clean-machine setup flow so every required blocker has a direct, obvious next step
- make the Ollama -> model download -> ready-to-chat path feel direct and obvious
- keep voice optional so the base install story stays simple

Still important later:
- remove or quarantine any leftover compatibility scaffolding that no longer serves the base runtime

## Verified

Verified in this workspace:
- `npm run build` succeeds in `local-ai/`
- `cargo check` succeeds in `local-ai/src-tauri/`
- `npm run tauri:dev` launches and remains resident long enough to hold the Vite dev port and run `local-ai.exe`
- the live source no longer contains the removed multi-workspace UI/state hooks
- Curator automation can process a request and produce a staged package
- ModernClaw can display and import a staged Curator package when it is placed in the active workspace path
- image attachments compile cleanly from UI to workspace storage to model request path
- the live source now wires audio-note recording, Whisper transcription, attachment storage, history persistence, and conversation rendering through the shared attachment pipeline
- the hidden runtime profile layer is being narrowed to built-in Main Workspace and Joe Support profiles instead of generic user-managed brains
- `npm run build` still succeeds after the built-in Main Workspace plus Joe Support profile cleanup
- `cargo check` still succeeds after the built-in Main Workspace plus Joe Support profile cleanup
- `npm run build` and `cargo check` still succeed after adding the first-pass setup-action flow

Current build notes:
- Vite reports a large frontend bundle warning
- Rust still has a few existing dead-code warnings
- the current Curator integration still carries compatibility-oriented workspace assumptions that should be simplified further for base

## Curator / Knowledge Status

Built now:
- Curator automation can process Markdown request files and stage importable packages
- active-workspace resolution is documented and validated
- Curator packages can be reviewed and imported through the app
- reply feedback can be captured and summarized locally

Partially built:
- Curator intake-as-interpreter is specified, but the primary one-box user flow is not yet a first-class app feature
- feedback analytics exist, but only as a lightweight summary card rather than deeper reporting
- NotebookLM workflow is documented, but only parts of the surrounding pipeline are live

Not built yet:
- true NotebookLM extraction through the live Curator pipeline
- first-class Rosie verification in the app or package-review flow
- built-in knowledge rollback, edit, provenance, and removal tooling strong enough to replace review-first safety

## Remaining To Reach Base Ready

1. Polish clean-machine setup into a direct install flow with strong guidance and fewer dead ends.
2. Audit the app for remaining compatibility-only UI, state, and terminology after the profile-layer cleanup.
3. Decide what minimum compatibility scaffolding must remain in the base repo for migration safety.
4. Decide whether Curator automation should keep following compatibility-era workspace assumptions or be simplified into one clearer base-workspace path.
5. Decide whether the one-box Curator intake flow belongs in base at all or remains part of the fuller multi lane.
6. Define the base-ready milestone that separates transitional shipped scope from finished base scope.
7. Move curator out of the base definition once the base-ready milestone is reached.
8. Tidy remaining docs so they match the in-progress split state and then the final base state.

## Open Questions

- whether Joe Support should remain a hidden support lane or later gain a small surfaced entry point in base
- whether the current Brain naming and positioning is final for the base edition
- whether NotebookLM-powered curation belongs in base, multi, or only external automation
- whether Rosie verification should stay external first or become a surfaced in-app review layer
- what exact milestone marks base-ready and triggers the curator handoff to the fuller multi product

## Working Rule

Keep this file short, current, and execution-focused.

If it stops reflecting the real split state, update it immediately.
