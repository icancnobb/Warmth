# Product-Spec.md - Warmth v2

## 1. Product Goal

Warmth v2 is a local-first emotional companion focused on four core loops:

1. Daily mood journaling
2. Reflective chat support
3. Free-form drawing for emotional release
4. Personal baseline profile storage

## 2. Design Principles

- Keep routes thin and business logic modular.
- Persist data in predictable namespaced keys.
- Keep user workflows simple and fast.
- Preserve privacy through local-first behavior.

## 3. Functional Scope

### 3.1 Home

- Show quick metrics for journal entries, chat turns, and saved artworks.
- Provide direct entry points into each module.

### 3.2 Journal

- Save one entry per selected date.
- Track mood and a short reflection note.
- View and delete recent entries.

### 3.3 Chat

- Capture user prompts and response history.
- Generate supportive guidance using local profile and journal context.
- Clear full history on demand.

### 3.4 Draw

- Draw with color and line-width controls.
- Save canvas snapshots.
- Manage a local gallery of saved artworks.

### 3.5 Profile

- Maintain identity and preference fields.
- Autosave all profile inputs.

## 4. Non-Functional Constraints

- Local interactions should remain responsive (<100ms average writes).
- No external data transmission in current version.
- Clear file-level ownership for easier extension.

## 5. Future Extensions

- Encrypted local vault mode.
- Optional cloud sync adapter.
- Pluggable LLM backend for chat engine.
