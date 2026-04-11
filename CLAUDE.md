# CLAUDE.md

## Repo Role
This workspace is for `ModernClawBase`, the free and open-source base edition of ModernClaw.

The product here is a focused single-workspace desktop app with built-in Joe Support.

## Product Goal
ModernClawBase should be:
- local-first
- simple
- understandable
- stable
- useful on its own
- trustworthy as the open-core foundation

It should not feel like a teaser shell, a crippled demo, or a premium upsell funnel.

## Product Scope
Keep the base app centered on:
- one local workspace
- one built-in Joe Support lane for setup and troubleshooting
- conversation history
- `SOUL.md`, `USER.md`, `MEMORY.md`
- daily logs
- flat knowledge-file ingestion
- Brain view
- Settings
- Ollama integration
- one clear model lane: `gemma4:e4b`
- practical Piper and Whisper support
- clear onboarding and documentation

Keep out of scope for now:
- role-management surfaces
- generic multi-brain creation and lifecycle tooling
- workspace duplication and lifecycle tooling
- advanced automation
- premium expert packs
- enterprise or team workflow layers
- UI complexity that weakens clarity

## Development Principles
- simplify, do not degrade
- preserve useful product quality while reducing complexity
- prefer one clear workspace story over layered exceptions
- keep docs lean and current
- protect local-first trust
- avoid introducing paid-feature hooks into the base UX

## Model Strategy
ModernClawBase should keep one clear baseline model lane:
- `gemma4:e4b`

Avoid a confusing buffet of default models.

## Documentation Rules
Preferred docs:
- `README.md`
- `RUNBOOK.md`
- `MODERNCLAW_BASE_SPLIT_PLAN.md`
- focused product or system docs only when they stay current

Avoid overlapping planning documents and stale implementation notes.

## Implementation Strategy
When making changes in this repo:
- optimize for simplicity and stability
- remove unnecessary complexity cleanly
- call out scope drift quickly
- prefer consistent wording like `workspace` when it matches the product
- keep the base product respectable and complete
