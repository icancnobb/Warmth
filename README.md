# Warmth v2

Warmth is fully rebuilt from scratch with a modular architecture and clean local-first behavior.

## What changed

- Replaced the previous codebase with a new layered structure: `app`, `components`, `features`, `hooks`, and `lib`.
- Reimplemented all core modules (journal, chat, draw, profile) with isolated types and storage contracts.
- Switched to a single persistence mechanism based on localStorage namespaced keys.
- Added a lightweight local chat engine that uses profile + journal context for responses.
- Added baseline tests for storage and chat response behavior.

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
  features/           # business modules by domain
  hooks/              # cross-feature hooks
  lib/                # shared utility layer
  tests/              # core unit tests
```
