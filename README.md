# Capgemini Exceller 2027 Practice Lab

Local-first, time-bound preparation for the supplied Capgemini Exceller assessment framework. It converts the original upstream Markdown book into a typed question bank and interactive practice environment; the original Markdown remains source material only and is not the app UI.

## Run on Windows

1. Install Node.js 22+, Docker Desktop, and a C/C++/Java-capable Docker environment.
2. Copy `.env.example` to `.env`. Add `GEMINI_API_KEY` to enable real Gemini chat. Without it, the AI Coding Lab gives a clear unavailable state.
3. In a separate PowerShell window, start Docker Desktop and run `npm run runner:setup` once. This downloads the C/C++ and Java sandbox images before your first code execution.
4. Run `npm install` and then `npm run dev`.
4. Open `http://localhost:5173`. The local API uses `http://localhost:8787`.

## Commands

- `npm run validate:data` validates the local question/challenge bank.
- `npm run import:research` regenerates the typed import from both user-provided research packs.
- `npm run runner:setup` pre-downloads the Docker images required by the local code runner.
- `npm test` runs unit tests.
- `npm run build` builds the client bundle.
- `npm run test:e2e` runs Playwright after installing browsers with `npx playwright install chromium`.

## Security boundaries

Gemini keys stay in the Node API process and never ship to the browser. Docker execution is local, network-disabled, memory/CPU/PID-limited, read-only except a temporary filesystem, and runs as an unprivileged user. Docker must be running before execution is offered.

## Scope status

The project now provides 452 MCQs (172 AI, 154 technical, 40 communication, and 86 reasoning), 34 debugging challenges, and 40 AI-coding challenges. This includes two supplied research packs: their original, research-informed scenarios are labelled `RECONSTRUCTED` or `CANDIDATE_REPORTED`, not official or leaked questions. The supplied PPT remains the official framework source. Motion and Grid Challenge are deliberately not reproduced.
