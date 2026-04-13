# Architecture - Warmth v2

## Layer Model

1. `src/app`
   - Route and page composition only.
2. `src/components`
   - Shared shell/navigation UI.
3. `src/features`
   - Domain modules and feature UI.
4. `src/hooks`
   - Cross-feature state persistence hooks.
5. `src/lib`
   - Generic storage utilities.

## Data Ownership

- Journal: `journal.entries`
- Chat: `chat.history`
- Draw: `draw.artworks`
- Profile: `profile.card`

All keys are namespaced internally under `warmth.v2.*`.

## Why this architecture

- Easier testing: business logic moved outside routes.
- Easier migration: keys and model types are centralized.
- Easier collaboration: each feature directory is independently maintainable.
