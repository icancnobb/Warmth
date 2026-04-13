# Product-Spec.md - Warmth v2

## 1. Positioning

### 1.1 Positioning statement

For people who carry high mental load and want private emotional support, Warmth is a local-first emotional self-care companion that helps users reset in five minutes per day through journaling, reflective chat, and free drawing.

Unlike social wellness apps or generic AI chat products, Warmth emphasizes privacy by default, a low-friction daily ritual, and emotional regulation over content consumption.

### 1.2 Target users

Primary users:

- students and early-career professionals with mood fluctuation and stress accumulation
- knowledge workers and creators who need decompression between intense work cycles
- users who want a private, lightweight, and non-judgmental emotional tool

Secondary users:

- people transitioning from paper journaling to structured digital tracking
- users trying to build a stable daily reflection habit

### 1.3 Core pain points

- emotional state is hard to name consistently
- journaling apps feel too heavy to use every day
- social apps create performance pressure and reduce psychological safety
- users need a fast and private ritual, not another information feed

### 1.4 Product differentiation

- local-first data model with no forced cloud sync
- integrated reflection loop: mood log, contextual chat, and drawing release
- simple UI focused on daily completion, not feature sprawl

### 1.5 Product boundaries

Warmth does:

- support self-awareness and emotional regulation habits
- help users externalize and structure daily emotional signals

Warmth does not:

- provide clinical diagnosis
- replace therapy or crisis-response support
- operate as a social media product

## 2. Product goals

User outcome goals:

- make emotional check-in possible in under 5 minutes
- increase consistency of daily reflection behavior
- reduce emotional overload through structured expression

Product goals:

- retain users through habit value, not novelty
- preserve trust through strict privacy defaults
- keep architecture modular for rapid iteration

## 3. Design principles

- keep routes thin and feature logic modular
- keep interactions calm, direct, and low-cognitive-load
- keep storage predictable with explicit key ownership
- keep all core value available offline and local-first

## 4. Functional scope

### 4.1 Home

- show key metrics: journal entries, chat turns, artworks
- provide direct action entry points for the four core loops

### 4.2 Journal

- save one entry per selected date
- track mood and a short note
- review and delete recent entries

### 4.3 Chat

- capture user prompts and conversation history
- generate supportive responses using local journal and profile context
- clear full history on demand

### 4.4 Draw

- provide color and brush-size controls
- save canvas snapshots to local gallery
- remove saved artworks

### 4.5 Profile

- maintain display name, birthday, pronouns, and support preference signature
- autosave user profile locally

## 5. Success metrics

Habit metrics:

- day-1 activation: first journal entry completed within first session
- weekly continuity: number of distinct days with at least one check-in
- loop completion: percentage of sessions that complete one full action (journal/chat/draw)

Quality metrics:

- median time to first meaningful action < 30 seconds
- average daily check-in completion time < 5 minutes
- local write/read interaction latency < 100ms (target)

## 6. Non-functional constraints

- no external data transmission in current version
- architecture must keep feature boundaries explicit
- baseline tests must cover storage and core response logic

## 7. Future extensions

- encrypted local vault mode
- optional cloud sync adapter
- pluggable LLM backend with user-controlled provider settings
- weekly reflection reports generated from journal trends
