# Architecture

The project remains a React 19 + Vite + TypeScript local-first application. Keeping this working foundation avoids a disruptive framework rewrite.

- **Content:** typed static data for questions, challenges, lessons, roadmap, and evidence.
- **Persistence:** Dexie/IndexedDB for attempts, notes, preferences, mock sessions, lesson progress, and revision items.
- **Server-only optional services:** Express handles Gemini requests and the Docker-restricted runner. The client remains functional when neither is configured.
- **Practice engine:** deterministic selection, scoring, timing, answer review, automatic mistake capture, and next-day revision scheduling.
- **Safety:** code execution is only offered through the existing network-disabled, resource-limited Docker runner; no browser eval is used.
