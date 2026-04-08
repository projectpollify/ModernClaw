# ModernClawBase Scope Plan

## Purpose

This document defines the intended product shape for `ModernClawBase`.

It exists to keep the repo disciplined around one clear goal:

- a focused local-first desktop workspace
- one durable user-facing workspace
- one clean model lane
- one trustworthy open-core product

## Product Definition

ModernClawBase is:
- free and open-source
- local-first
- single-workspace
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
- curator staging only if it remains useful and understandable

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

Internal compatibility layers are acceptable if they help future migration, but the user-facing product should stay simple.

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

## Immediate Priorities

1. Keep the live product aligned with the single-workspace scope.
2. Remove wording that suggests extra product layers the app no longer exposes.
3. Preserve local-first trust and usability.
4. Improve polish only when it supports the core base product.

## Guiding Principle

ModernClawBase should be:
- open
- useful
- simple
- stable
- trustworthy

If a change makes the product harder to explain, harder to support, or less coherent, it is probably outside the right scope.
