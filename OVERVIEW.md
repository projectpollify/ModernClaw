# ModernClaw Overview

ModernClaw is a local-first AI assistant app designed to feel more like a private personal workspace than a generic chatbot.

It is built for people who want:

- their AI to run on their own machine
- visible control over memory and settings
- a simpler setup experience than a heavier agent stack
- durable context they can inspect and edit directly

## What ModernClaw Is

ModernClaw is a desktop app for chatting with a local model while keeping your long-term context in editable Markdown files.

Instead of hiding memory inside a black box, ModernClaw gives you a workspace with files like:

- `SOUL.md` for personality and behavior
- `USER.md` for stable information about you
- `MEMORY.md` for durable facts, projects, and decisions
- daily logs and knowledge files for additional context

The goal is not just to talk to an AI once.

The goal is to build a private, understandable AI workspace that gets more useful over time without taking control away from the user.

## Core Product Idea

ModernClaw tries to combine five things:

1. local-first privacy
2. editable memory
3. durable long-term context
4. approachable desktop UX
5. practical setup and model management

That makes it different from:

- cloud-first chat apps that hide where context lives
- agent platforms that feel more like infrastructure than products
- raw local AI setups that are powerful but hard to install and maintain

## Current Shape

The current base product is focused around one visible local workspace with:

- chat with conversation history
- built-in Joe Support for setup and troubleshooting
- onboarding and settings
- setup-readiness checks with required and optional items
- editable memory files
- local Ollama model management
- local voice output and input
- image attachments for multimodal prompts
- audio-note attachments with Whisper transcription
- Brain-guided refinement flows
- knowledge-file loading
- Curator staging and import support

The product is still in an active MVP phase.

Some internal architecture is still shared with a fuller multi-brain version, but the base experience is now being tightened around one user workspace plus built-in Joe Support instead of a generic hidden agent layer.

## Why It Matters

ModernClaw is trying to make local AI feel understandable.

That means:

- users can see where their data lives
- users can inspect and edit core memory directly
- setup should become clearer over time, not more confusing
- the app should feel like a product, not a pile of tools

## Who It Is For

ModernClaw is a strong fit for people who want:

- a private assistant on their own machine
- a local AI companion for daily life or creative work
- direct control over memory and behavior
- a more guided experience than building everything manually

It is especially useful for users who like the idea of local AI, but do not want to live inside terminal-first tooling all day.

## Direction

The near-term direction is:

- make setup easier
- make readiness clearer
- strengthen the single-workspace experience
- improve multimodal support like image understanding and audio-note workflows
- keep Joe Support useful without exposing full multi-brain management
- keep the product local, legible, and trustworthy

## Short Version

ModernClaw is a private local AI workspace:

- chat locally
- manage your own memory
- keep your files on your machine
- shape the assistant over time
- use a real desktop app instead of a confusing stack of scripts
