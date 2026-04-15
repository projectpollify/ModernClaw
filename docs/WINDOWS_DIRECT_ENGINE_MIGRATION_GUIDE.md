# Windows Direct Engine Migration Guide

## Purpose

This document explains how to update the Windows versions of ModernClaw to use the new direct `llama.cpp` engine instead of LM Studio or Ollama.

This guide is based on the working Mac implementation in:

- `/Users/shawn/Desktop/ModernClawMacMulti`

That repo is the current reference implementation for:

- direct `llama.cpp` runtime
- model discovery
- direct-engine setup flow
- model switching
- prompt/context behavior

## Recommended Rollout Order

Do not update every Windows repo at once.

Use this order:

1. `ModernClaw` (Windows single-brain) -> direct engine
2. verify it fully
3. `ModernClawMulti` (Windows multi-brain) -> same direct engine layer
4. verify it fully

Reason:

- `ModernClaw` is the safest baseline
- once the Windows direct-engine layer is stable there, the same runtime layer can be reused in `ModernClawMulti`
- this avoids debugging Windows platform issues and multi-brain issues at the same time

## Target Architecture

Old pattern:

- `ModernClaw -> LM Studio -> model runtime`
- or `ModernClaw -> Ollama -> model runtime`

New pattern:

- `ModernClaw -> llama-server -> GGUF model`

Standard local API target:

- `http://127.0.0.1:8080/v1/models`
- `http://127.0.0.1:8080/v1/chat/completions`

## What Exists Now In The Mac Reference

The Mac implementation already includes:

- a direct-engine provider service
- setup commands to start the engine
- model switching logic
- settings for executable path and GGUF path
- provider-aware frontend copy and status checks
- model discovery from local GGUF folders

Key files:

- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src-tauri/src/services/llama_cpp.rs`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src-tauri/src/services/provider.rs`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src-tauri/src/commands/setup.rs`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src/lib/providerConfig.ts`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src/services/setup.ts`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src/types/settings.ts`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src/stores/modelStore.ts`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src/components/models/ModelSelector.tsx`
- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src/components/settings/SettingsView.tsx`

## Phase 1: Update Windows `ModernClaw`

### 1. Port the backend direct-engine service

Bring over:

- `local-ai/src-tauri/src/services/llama_cpp.rs`

Purpose:

- call `llama-server` on `127.0.0.1:8080`
- list models from `/v1/models`
- send chat requests to `/v1/chat/completions`
- merge served models with locally discovered GGUF files

What to adjust for Windows:

- local model roots in `discover_local_models()`
- Windows file path handling
- `llama-server.exe` path detection

Recommended Windows model roots:

- `%LOCALAPPDATA%\\ModernClaw\\models`
- optionally existing LM Studio model cache locations if you want migration convenience

Recommended first-step model discovery strategy:

- scan only your app-managed models folder first
- add legacy LM Studio discovery only if you want a migration helper

### 2. Port provider routing

Bring over:

- `local-ai/src-tauri/src/services/provider.rs`
- any related `mod.rs` wiring

Goal:

- Windows should choose the direct engine provider instead of LM Studio/Ollama

If you want a clean Windows direct-engine product, remove the old runtime as the default path rather than keeping it as the main branch.

### 3. Replace setup/startup logic

Use:

- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src-tauri/src/commands/setup.rs`

Important:

The current Mac file still has a Windows fallback branch that starts Ollama. That is not what you want for the new Windows direction.

For Windows, change the setup behavior so `setup_start_ollama` becomes a direct-engine starter in practice, or rename it once you are ready to clean up the legacy naming.

Windows-specific behavior to implement:

- detect `llama-server.exe`
- read configured:
  - `directEngineExecutablePath`
  - `directEngineModelPath`
- start:

```text
llama-server.exe -m <GGUF> --host 127.0.0.1 --port 8080
```

- if a matching `mmproj` exists, also pass:

```text
--mmproj <path>
```

- if you know the canonical model alias, pass:

```text
--alias google/gemma-4-e4b
```

Windows stop behavior:

- replace `pkill -f llama-server` with a Windows-safe process stop strategy
- simplest first pass:
  - `taskkill /IM llama-server.exe /F`
- better later:
  - track the spawned PID and stop only that process

### 4. Port frontend provider config

Bring over:

- `local-ai/src/lib/providerConfig.ts`

Target values:

- provider name = `Direct Engine`
- status URL = `http://127.0.0.1:8080/v1/models`
- app display name stays Windows-appropriate:
  - `ModernClaw`

### 5. Port settings support

Bring over:

- `local-ai/src/types/settings.ts`
- relevant settings UI from:
  - `local-ai/src/components/settings/SettingsView.tsx`

Required settings:

- `directEngineExecutablePath`
- `directEngineModelPath`
- `defaultModel`

Recommended Windows defaults:

- executable:
  - `%LOCALAPPDATA%\\ModernClaw\\tools\\llama.cpp\\llama-server.exe`
- models:
  - `%LOCALAPPDATA%\\ModernClaw\\models\\...`

### 6. Port setup UI and model UI

Bring over the direct-engine setup flow from the Mac implementation:

- `local-ai/src/services/setup.ts`
- setup status helpers
- model selector/store components
- model provider copy

Goal:

- stop telling users to install or open LM Studio
- stop telling users to start Ollama
- instead tell users:
  - install or configure `llama-server`
  - set GGUF model path
  - start engine

### 7. Keep the prompt/context fixes

Port:

- `/Users/shawn/Desktop/ModernClawMacMulti/local-ai/src-tauri/src/services/context.rs`

Why:

- the `SOUL.md` framing fix prevents the model from acting like it merely “read a file”
- the selected brain identity needs to be treated as active system instruction

This matters on Windows too, especially once multi-brain is updated later.

## Phase 2: Verify Windows `ModernClaw`

Before touching `ModernClawMulti`, verify all of this in Windows single-brain:

1. app launches
2. setup sees `llama-server`
3. app can start direct engine
4. `/v1/models` returns usable model names
5. model selector works
6. chat works
7. restart app -> engine flow still works
8. context/persona behavior still works

## Phase 3: Update Windows `ModernClawMulti`

Once `ModernClaw` is stable on Windows direct engine:

1. port the same direct-engine backend layer into `ModernClawMulti`
2. do not redesign multi-brain at the same time
3. treat the runtime swap as infrastructure only

Files likely to port from the direct-engine reference:

- `local-ai/src-tauri/src/services/llama_cpp.rs`
- `local-ai/src-tauri/src/services/provider.rs`
- `local-ai/src-tauri/src/commands/setup.rs`
- `local-ai/src/lib/providerConfig.ts`
- `local-ai/src/services/setup.ts`
- `local-ai/src/types/settings.ts`
- model/setup UI pieces

Then keep the existing multi-brain logic, but ensure:

- each brain resolves its own workspace path
- model switching still restarts `llama-server`
- chat still uses the selected model alias

## Windows-Specific Implementation Notes

### Executable path

Recommended:

- user-configurable path in settings
- plus sensible defaults

Suggested default install location:

- `%LOCALAPPDATA%\\ModernClaw\\tools\\llama.cpp\\llama-server.exe`

### Model storage

Recommended app-managed folder:

- `%LOCALAPPDATA%\\ModernClaw\\models`

Advantages:

- easier support
- easier packaging
- easier future in-app model management

### Process control

Windows process handling is the main platform difference.

Needed behaviors:

- start the engine
- stop the engine
- restart on model switch
- wait for `/v1/models` to come online after start

Do not rely on blind sleeps alone.

Keep the startup poll pattern:

- call `/v1/models`
- wait until it returns success
- only then update UI state

### Model aliasing

Keep canonical names when possible:

- `google/gemma-4-e2b`
- `google/gemma-4-e4b`

This keeps settings, selectors, and model switching consistent across Mac and Windows.

### Streaming

Current Mac direct-engine implementation uses non-streaming chat completion calls.

That means Windows can safely port the same first.

Later improvement:

- true token streaming from `llama-server`

Do not block the Windows migration on streaming.

## Exact File Checklist

### Port first to Windows `ModernClaw`

- `local-ai/src-tauri/src/services/llama_cpp.rs`
- `local-ai/src-tauri/src/services/provider.rs`
- `local-ai/src-tauri/src/services/mod.rs`
- `local-ai/src-tauri/src/commands/setup.rs`
- `local-ai/src-tauri/src/commands/chat.rs`
- `local-ai/src-tauri/src/lib.rs`
- `local-ai/src-tauri/src/services/context.rs`
- `local-ai/src/lib/providerConfig.ts`
- `local-ai/src/services/setup.ts`
- `local-ai/src/types/settings.ts`
- `local-ai/src/stores/modelStore.ts`
- `local-ai/src/components/models/ModelSelector.tsx`
- `local-ai/src/components/settings/SettingsView.tsx`
- setup and onboarding views that still mention LM Studio/Ollama

### Port second to Windows `ModernClawMulti`

Reuse the same direct-engine file set above, but do not overwrite multi-brain logic blindly.

## What Not To Do

- do not migrate both Windows repos at once
- do not copy the full Mac repo over the Windows app
- do not leave LM Studio as an invisible dependency if the goal is true direct engine
- do not mix runtime migration and multi-brain redesign into one big step

## Best Practical Plan

### Milestone 1

Windows `ModernClaw`:

- direct engine starts
- Gemma 4 model loads
- chat works

### Milestone 2

Windows `ModernClaw`:

- settings polished
- model switching works
- startup reliability good

### Milestone 3

Windows `ModernClawMulti`:

- same direct engine underneath existing multi-brain system

## Suggested Verification Commands on Windows

After wiring the engine, basic checks should look like:

```powershell
llama-server.exe -m C:\path\to\model.gguf --host 127.0.0.1 --port 8080
```

Then:

```powershell
curl http://127.0.0.1:8080/v1/models
```

And from the app:

- open Setup
- confirm Direct Engine is ready
- confirm model appears
- send a test message

## Final Recommendation

Use `ModernClawMacMulti` as the direct-engine reference implementation, but do the Windows migration in this order:

1. `ModernClaw`
2. `ModernClawMulti`

That is the safest path and the least confusing one.

