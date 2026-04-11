# ModernClawBase Scope Plan

## Purpose

This document defines the intended product shape for `ModernClawBase`.

It exists to keep the repo disciplined around one clear goal:

- a focused local-first desktop workspace
- one durable user-facing workspace
- one clean model lane
- one trustworthy open-core product

This split is still in progress.

The current shipped app may still contain features that belong to the fuller multi product while the base edition is being finished and cleaned up.

## Product Definition

ModernClawBase is:
- free and open-source
- local-first
- single-workspace
- one user workspace plus built-in Joe Support
- grounded in editable Markdown memory files
- useful on its own

ModernClawBase is not:
- a teaser shell
- a fragmented experiment
- a crowded power-user surface

## Core Identity

The base app should preserve the core ModernClaw identity:
- local chat
- durable context
- editable `SOUL.md`, `USER.md`, and `MEMORY.md`
- daily logs
- knowledge ingestion
- Brain-guided refinement
- practical local voice support
- understandable settings and storage behavior

## Required Base Feature Set

### Workspace
- one chat workspace
- one built-in Joe Support lane for setup and troubleshooting
- conversation history
- Memory view
- Brain view
- Settings view

### Files And Context
- editable `SOUL.md`
- editable `USER.md`
- editable `MEMORY.md`
- daily logs
- flat `knowledge/*.md` ingestion

Curator note:
Curator may remain in the shipped app during the transition, but it is not required to define the finished `ModernClawBase` product.

If curator is kept, it must stay simple and understandable.

If curator is moved out of base, it should be completed as part of the fuller multi product once the base edition is ready.

### Model Layer
- Ollama integration
- one clear baseline model lane: `gemma4:e4b`
- simple model refresh and selection flow

### Voice Layer
- local Piper output
- local Whisper input
- speech cleanup before Piper playback
- one clean voice setup story

### Product UX
- stable onboarding
- stable settings
- clear storage behavior
- clear setup and run instructions

## Things To Keep Out Of Scope

These should stay out of the base product unless they become essential:
- role-management surfaces
- generic multi-brain creation and lifecycle tooling
- workspace cloning, archiving, snapshots, or templates
- advanced automation and recurring workflows
- premium expert packs
- enterprise or team layers
- convenience features that add complexity before the core product is polished

## Product Standards

ModernClawBase should feel:
- clear
- calm
- capable
- dependable

It should be easy to explain:
- where files live
- how context works
- how model choice works
- how voice setup works

## Technical Direction

### Workspace Model
The app should present one durable local workspace.

If the base product keeps a second assistant lane, it should be a built-in Joe Support profile rather than a generic user-managed brain system.

Joe Support should share the same workspace root unless a separate support workspace becomes truly necessary.

Internal compatibility layers are acceptable if they help future migration, but the user-facing product should stay simple.

During the split, the repo may still carry compatibility layers or fuller-product features while the base shape is being finished.

### Settings Model
The base app should keep one understandable settings story:
- one saved workspace model preference
- one storage location story
- one voice configuration story

### Documentation Model
The repo should stay lean.

Preferred documentation:
- `README.md`
- `RUNBOOK.md`
- this scope plan
- a small number of focused supporting specs

Avoid carrying stale planning packs or overlapping status docs.

Until the split is complete, docs should prefer being explicit about transition state over pretending the base cleanup is already finished.

## Immediate Priorities

1. Keep the live product aligned with the single-workspace scope.
2. Remove wording that suggests extra product layers the app no longer exposes.
3. Clarify which current features are transitional versus part of the finished base product.
4. Preserve local-first trust and usability.
5. Improve polish only when it supports the core base product.

## Guiding Principle

ModernClawBase should be:
- open
- useful
- simple
- stable
- trustworthy

If a change makes the product harder to explain, harder to support, or less coherent, it is probably outside the right scope.
