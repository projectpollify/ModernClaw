# PROGRESS.md

## Current Status

ModernClawBase now presents as a focused single-workspace product.

Completed in the current checkpoint:
- removed the multi-workspace selector and related create/delete flows from the live app
- simplified app initialization around one durable workspace
- flattened the Brain suggestion store to one workspace
- rewrote visible product copy around `workspace` instead of role-management language
- updated root docs to the ModernClawBase identity
- removed stale planning and summary docs that no longer matched the product

## Verified

Verified in this workspace:
- `npm run build` succeeds in [local-ai](C:\Users\pento\Desktop\ModernClawBase\local-ai)
- `cargo check` succeeds in [src-tauri](C:\Users\pento\Desktop\ModernClawBase\local-ai\src-tauri)
- `npm run tauri:dev` launches and remains resident long enough to hold the Vite dev port and run `local-ai.exe`
- the live source no longer contains the removed multi-workspace UI/state hooks

Current build notes:
- Vite reports a large frontend bundle warning
- Rust still has a few existing dead-code warnings

## Current Product Shape

ModernClawBase currently includes:
- one local workspace
- chat with conversation history
- editable `SOUL.md`, `USER.md`, and `MEMORY.md`
- daily logs
- flat knowledge-file loading
- Brain suggestions and guided setup
- curator staging and import flow
- local Piper output and Whisper input
- onboarding, settings, and storage visibility

## Open Questions

- whether to keep or further simplify the internal compatibility-friendly agent layer
- whether curator should remain part of the base product unchanged or be simplified
- whether the current Brain naming and positioning is final for the base edition

## Next Priorities

1. Run a manual `tauri:dev` QA pass across chat, memory, Brain, settings, and curator flows.
2. Decide how much of the internal compatibility layer should remain in the base repo.
3. Tidy any remaining secondary docs or labels discovered during manual QA.
4. Consider a small performance pass if frontend bundle size becomes a practical issue.

## Working Rule

Keep this file short and current.

If it stops reflecting the actual state of the repo, update it or delete it.
