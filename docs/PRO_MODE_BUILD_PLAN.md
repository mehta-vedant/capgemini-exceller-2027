# Exceller Pro Mode — build plan

## Product boundary

The existing **Lab** remains a fast, local practice workspace. Pro Mode is a separate learning system that links evidence, lessons, assessment practice, revision, and interview preparation. It does not replace existing `/module`, `/mocks`, `/debugging`, `/ai-coding`, or research-bank routes.

## Learner journey

1. Open `/pro` and choose a 7-, 14-, or 30-day study horizon.
2. Continue the next roadmap block from the dashboard.
3. Read a self-contained P0 lesson at `/learn/:module/:lesson`.
4. Mark it complete, then move to its linked scenario or subject practice.
5. Attempt a timed 20+20 original-question mock and review every option only after submission.
6. See missed topics and scheduled revision prompts in the dashboard and notebook.
7. Use debugging, AI-assisted coding, and interview studios for later roadmap blocks.

## Information architecture

| Surface | Route | Purpose |
| --- | --- | --- |
| Pro dashboard | `/pro`, `/dashboard` | Current plan, next action, readiness, adaptive revision |
| Assessment Intelligence | `/assessment-pattern` | Evidence register with confidence and source boundaries |
| Curriculum | `/curriculum` | Module, lesson, progress and practice inventory |
| Lesson reader | `/learn/:module/:lesson` | Original P0 explanations, examples, traps and linked practice |
| Scenario arena | `/practice/scenarios` | Scenario-only question filtering |
| MCQ center | `/practice/mcq` | Topic/difficulty/format selection |
| Mock simulator | `/mock-test` | 40-question, 45-minute default test |
| Practice labs | `/practice/debugging`, `/practice/ai-coding` | Existing sandboxed/debug and assisted-coding experiences |
| Revision notebook | `/mistakes` | Recorded incorrect answers plus retest paths |
| Interview studio | `/interview` | Technical/project/behavioral guided prompts |

## Data and persistence

Content is versioned TypeScript data with stable IDs. Browser IndexedDB remains the single-user persistence layer, avoiding a destructive migration from the working local-first Lab.

- Existing: question attempts, mock sessions, notes, preferences.
- Added: lesson progress and revision items.
- Profile preferences: study horizon, study hours, target track, cognitive inclusion, language, theme.
- Deterministic answer keys remain static content and are never generated during grading.

## Content scope and honesty

The first content release contains complete P0 learning guides for AI/ML evaluation, LLMs/Transformers, RAG/security, responsible AI, SQL/DBMS, programming logic, and testing/AI-assisted development. The existing 452-question bank and 34 debugging/40 AI-coding challenges supply the practice inventory.

Candidate reports are evidence, not official policy. No cutoff, package allocation, exact campus order, or expansion of the unresolved term “RRP” is asserted. Original/reconstructed practice is visibly labeled as such.

## Build order

1. Content model, evidence register, lesson progress migration. ✅
2. Pro dashboard, curriculum and lesson reader.
3. Assessment Intelligence, interview studio and stable route aliases.
4. Scenario/MCQ selectors, mock configuration, mistake notebook and analytics enhancements.
5. Integrate automatic revision items from incorrect answers.
6. Validate schemas, unit behavior, production build, and end-to-end learner route coverage.

## Done criteria

- Legacy Lab routes still pass their current tests.
- Pro Mode has no dead primary navigation.
- Learner can complete a lesson, practice its linked material, and see persisted progress.
- Evidence source claims show confidence and caveats.
- Build, data validation, unit tests and browser tests pass.
