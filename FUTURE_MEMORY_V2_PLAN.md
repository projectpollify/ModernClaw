# Future Memory V2 Plan

## Purpose

This document captures a future direction for ModernClaw after the base product is installable, stable, and easy to explain.

The goal is to borrow the strongest offline architecture patterns from systems like GBrain without turning ModernClawBase into a complicated infrastructure product.

This is not the current execution priority.

Current priority remains:

- easy install
- simple setup
- stable local chat
- clear workspace behavior

## Core Idea

ModernClaw can adopt most of the valuable memory architecture patterns from GBrain while remaining fully offline.

The most important insight:

- the best parts are mostly structure and workflow patterns
- they are not inherently cloud features

Examples:

- compiled truth plus timeline
- markdown as source of truth
- MECE folder organization
- resolver files
- entity detection
- backlinks and cross-references
- dream cycle or consolidation pass
- hybrid retrieval

These are architecture decisions.

## What Stays Offline

The following can work entirely on-device:

- markdown knowledge and memory files
- local file read/write loops
- entity detection using local Gemma
- compiled truth plus timeline structure
- folder resolvers and organization rules
- source attribution discipline
- nightly or manual dream cycle
- keyword retrieval with FTS or ripgrep
- backlinks and local graph parsing
- local sidecar metadata files

## What Needs Local Replacements

If ModernClaw adopts a more retrieval-heavy memory system, the cloud replacements should remain local-first:

- `Supabase + pgvector` -> `SQLite + FTS5 + sqlite-vec` or `DuckDB`
- hosted embeddings -> local embedding models
- hosted query expansion -> local Gemma
- cloud hybrid retrieval -> local lexical plus vector retrieval

Candidate local embedding models:

- `all-MiniLM-L6-v2`
- `bge-small-en`
- `nomic-embed-text`

Selection rule:

- prefer the smallest model that gives clearly better retrieval than keyword-only search

## What We Lose Offline

The main losses are external enrichment and live sync from outside systems:

- web search
- social monitoring
- automatic external profile enrichment
- live SaaS integrations that depend on hosted APIs
- passive ingestion from external cloud tools

This is acceptable for ModernClawBase.

The tradeoff is:

- less automatic enrichment
- more user-supplied source material
- stronger privacy
- simpler local trust model

## Product Constraints

This future system must not break the strengths of ModernClawBase.

It must preserve:

- local-first behavior
- understandable files
- simple setup
- one user workspace
- Joe Support as a built-in support lane, not a generic multi-agent platform

It must avoid:

- turning the base app into a database admin product
- requiring a server for normal use
- adding so many dependencies that clean-machine setup becomes fragile
- silent autonomous memory mutation without user visibility

## Recommended Architecture

```text
┌───────────────────────┐
│ Markdown Brain Repo   │
│                       │
│ Source of truth       │
│ - MEMORY.md           │
│ - knowledge/          │
│ - timeline/           │
│ - compiled/           │
└──────────┬────────────┘
           │
           │ sync / parse
           ▼
┌───────────────────────┐
│ SQLite Index Layer    │
│                       │
│ - FTS5 lexical search │
│ - metadata tables     │
│ - optional sqlite-vec │
└──────────┬────────────┘
           │
           │ retrieve / enrich
           ▼
┌───────────────────────┐
│ Local LLM Layer       │
│                       │
│ - Gemma               │
│ - entity extraction   │
│ - query expansion     │
│ - consolidation       │
└───────────────────────┘
```

Principle:

- markdown stays canonical
- SQLite is an index, not the source of truth
- the local model helps interpret and maintain the repo

## Recommended Knowledge Model

Future schema should distinguish between stable synthesized truth and raw chronological material.

Suggested shape:

- `knowledge/`
- `knowledge/compiled/`
- `knowledge/timeline/`
- `knowledge/entities/`
- `knowledge/inbox/`
- `knowledge/.raw/`

Suggested meanings:

- `compiled/`: durable synthesized current truth
- `timeline/`: dated observations, notes, imports, or event records
- `entities/`: canonical pages for people, companies, projects, concepts, etc.
- `inbox/`: unprocessed or lightly processed material
- `.raw/`: sidecars, extraction metadata, source artifacts

This should remain legible to a normal user in a file browser.

## Retrieval Strategy

The first thing to steal from GBrain should be retrieval, not full autonomy.

### Phase 1 Retrieval

- add lexical indexing with `SQLite FTS5`
- index titles, headings, summaries, filenames, tags, and content excerpts
- retrieve only the most relevant files or sections for prompt assembly

Why:

- lowest complexity
- no extra model required
- likely enough to outperform flat knowledge loading immediately

### Phase 2 Retrieval

- add local embeddings only if lexical retrieval is clearly insufficient
- embed files or chunks into a local vector index
- combine lexical and vector results with a simple rank fusion strategy

Why:

- improves semantic retrieval
- still fully local
- should come only after proving the lexical layer is working

### Phase 3 Retrieval Refinement

- use local Gemma for light query expansion or reranking
- keep this bounded and transparent
- prefer deterministic retrieval over agentic overreach

## Dream Cycle

Dream cycle should come later, after retrieval and schema exist.

Purpose:

- consolidate notes into durable knowledge
- detect duplication
- suggest merges or promotions from timeline to compiled truth
- identify stale or conflicting files

Rules:

- start with manual or user-approved execution
- only later consider scheduled runs
- output reviewable suggestions before mutating canonical files
- preserve source attribution

Dream cycle should feel like maintenance assistance, not a secret autonomous editor.

## Entity Detection

Entity extraction is useful, but should be phased carefully.

Recommended order:

1. detect entities on knowledge import or save
2. suggest links to existing entity pages
3. create or update entity summaries only with review
4. avoid doing heavy extraction on every message at the start

This keeps latency predictable and implementation simpler.

## Suggested Implementation Phases

### Phase 0: Base Ready First

Do this before Memory V2:

- easy install
- simple setup flow
- clean model download path
- stable workspace behavior
- clear optional voice setup

### Phase 1: Selective Retrieval

Build:

- SQLite metadata tables
- FTS5 indexing for knowledge and memory content
- prompt builder that selects relevant files instead of loading everything

Success criteria:

- lower prompt noise
- better answers on larger knowledge sets
- no extra install burden beyond SQLite

### Phase 2: Schema Upgrade

Build:

- compiled versus timeline structure
- migration helpers for current `knowledge/`
- resolver file conventions
- source metadata sidecars where needed

Success criteria:

- users can understand where truth lives
- imported material no longer becomes a flat pile

### Phase 3: Optional Embeddings

Build:

- local embedding generation
- vector index
- lexical plus vector rank fusion

Success criteria:

- clear win over FTS-only retrieval
- acceptable CPU and disk footprint
- still offline and understandable

### Phase 4: Dream Cycle

Build:

- manual consolidation workflow
- nightly optional maintenance pass
- reviewable proposals for merge, dedupe, summarize, and promote

Success criteria:

- knowledge quality improves over time
- user trust remains high
- no silent destructive behavior

## Install Discipline

This future direction should not be allowed to sabotage install simplicity.

Rules:

- do not add embeddings before proving FTS is insufficient
- prefer SQLite features already present on the machine where possible
- avoid introducing mandatory background daemons
- keep every optional subsystem truly optional
- make retrieval degrade gracefully when an advanced component is unavailable

## Decision Summary

ModernClaw should borrow from GBrain in stages:

1. retrieval first
2. schema second
3. embeddings third
4. dream cycle last

This preserves the strengths of ModernClawBase while still moving toward a much stronger offline memory architecture.

## Working Principle

Do not copy GBrain wholesale.

Steal the parts that make local AI more useful:

- selective retrieval
- durable structure
- compiled truth plus timeline
- reviewable maintenance

Leave behind the parts that would make ModernClawBase harder to install, harder to explain, or less trustworthy.
