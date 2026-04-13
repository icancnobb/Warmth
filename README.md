# Warmth v2

Warmth is a local-first emotional self-care companion for people with high mental load.

## Product positioning

- Core promise: a 5-minute daily emotional reset you can sustain.
- Category: personal emotional care tool, not a social network and not clinical therapy software.
- Primary users:
  - students and young professionals under constant context switching
  - developers and creators who need private decompression after focused work
  - users who want emotional journaling but dislike heavy or performative apps
- Key differentiation:
  - local-first privacy by default
  - one practical loop: journal + reflective chat + free drawing
  - no feed pressure, no public profile, no social comparison loop
- Product boundary:
  - supports self-reflection, emotional naming, and daily regulation habits
  - does not replace medical diagnosis, emergency support, or psychotherapy

## What changed in v2

- Replaced the previous codebase with a layered structure: `app`, `components`, `features`, `hooks`, and `lib`.
- Reimplemented all core modules (journal, chat, draw, profile) with isolated storage contracts.
- Switched to a unified local persistence pattern based on namespaced localStorage keys.
- Added a lightweight local response engine that uses profile and journal context.
- Added baseline tests for storage and chat behavior.

## Tech stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Vitest + jsdom
- Local storage persistence

## Run locally

```bash
npm install
npm run dev
```

## Project structure

```text
src/
  app/                # routes and page composition
  components/         # shared UI shell
  features/           # domain modules
  hooks/              # cross-feature hooks
  lib/                # shared utility layer
  tests/              # unit tests
```
