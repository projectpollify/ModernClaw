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
- added image attachments with workspace-backed storage and conversation rendering
- rewrote visible product copy around `workspace` instead of role-management language
- updated root docs to the ModernClawBase identity
- removed stale planning and summary docs that no longer matched the product

## Locked Decisions

- the split work so far has primarily removed the multi-Brain aspects of the app
- curator remains part of the currently shipped product during the transition
- curator is not required to define the finished `ModernClawBase` product
- curator is intended to complete the fuller multi product once the base edition is ready
- documentation should describe transition state honestly until the split is finished

## Current Transition State

The current shipped app still includes:
- one local workspace
- chat with conversation history
- image prompts through attachments
- editable `SOUL.md`, `USER.md`, and `MEMORY.md`
- daily logs
- flat knowledge-file loading
- Brain suggestions and guided setup
- shared setup-readiness checks with required vs optional items
- curator staging and import flow
- local Piper output and Whisper input
- onboarding, settings, and storage visibility

This means the fuller product shape is still more complete than the unfinished base edition.

## Current Execution Focus

The current execution focus has shifted from broad QA to packaging clarity and multimodal groundwork.

What is now in place:
- one visible setup-readiness flow shared across onboarding, Setup, Settings, and chat
- one working image-understanding path that keeps files in the local workspace

Immediate next feature:
- audio-note MVP through Whisper transcription plus attachment metadata

Still important later:
- the compatibility-friendly internal agent layer remains a base/full seam, especially around model and voice ownership

## Verified

Verified in this workspace:
- `npm run build` succeeds in [local-ai](C:\Users\pento\Desktop\ModernClawBase\local-ai)
- `cargo check` succeeds in [src-tauri](C:\Users\pento\Desktop\ModernClawBase\local-ai\src-tauri)
- `npm run tauri:dev` launches and remains resident long enough to hold the Vite dev port and run `local-ai.exe`
- the live source no longer contains the removed multi-workspace UI/state hooks
- Curator automation can process a request and produce a staged package
- ModernClaw can display and import a staged Curator package when it is placed in the active workspace path
- image attachments compile cleanly from UI to workspace storage to model request path

Current build notes:
- Vite reports a large frontend bundle warning
- Rust still has a few existing dead-code warnings
- the current Curator integration still depends on active-workspace path alignment between automation and app runtime

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

1. Audit the app for remaining compatibility-only UI, state, and terminology after the completed QA pass.
2. Build the audio-note MVP on top of the new attachment pipeline.
3. Collapse or hide the internal compatibility-friendly agent layer where it still controls single-workspace model and voice behavior.
4. Decide what minimum compatibility scaffolding must remain in the base repo for migration safety.
5. Decide whether Curator automation should keep following active agent workspaces or be simplified into one clearer base-workspace path.
6. Decide whether the one-box Curator intake flow belongs in base at all or remains part of the fuller multi lane.
7. Define the base-ready milestone that separates transitional shipped scope from finished base scope.
8. Move curator out of the base definition once the base-ready milestone is reached.
9. Tidy remaining docs so they match the in-progress split state and then the final base state.

## Open Questions

- whether the internal compatibility-friendly agent layer should stay hidden, be simplified into workspace settings, or be removed from base entirely
- whether the current Brain naming and positioning is final for the base edition
- whether NotebookLM-powered curation belongs in base, multi, or only external automation
- whether Rosie verification should stay external first or become a surfaced in-app review layer
- what exact milestone marks base-ready and triggers the curator handoff to the fuller multi product

## Working Rule

Keep this file short, current, and execution-focused.

If it stops reflecting the real split state, update it immediately.
