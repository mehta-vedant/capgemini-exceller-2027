# Developer integration contract

1. Exclude all Santosh Kumar repository content from this import's provenance; use ONLY files in this ZIP for this imported bank.
2. Import `scenario_mcqs.json` into a separate collection with `provenance=original_scenario_practice`. Keep `status=authored_needs_independent_review` until content QA.
3. For an official-style sample: choose 20 AI Literacy + 20 Technical MCQs at random, 45-minute shared timer (approximate). Only shuffle options with correct-option remapping.
4. Explanation and `correct_option` must remain server-side during live mock; after submit, show rationale.
5. Link inspiration IDs to `sources.json`; do NOT tag any of the 88 MCQs as actual historical wording.
6. Import `debugging_challenges.json`: provide editor and statement, compile/run against sandboxed isolated tests. Do not ship reference solutions or intended bug list to active-client payload.
7. Use `ai_assisted_challenges.json` as challenge specs; design rubric and implementation tests, rather than automatically scoring prompt text by substring matches.
8. Make an optional *higher-package repository-based track* for R05 with code-navigation and feature exercises. Different variants should not be mixed in a single official-style test.
9. Record separate accuracy by domain, timing, failure explanations, and difficulty; at present many authored MCQs are medium/hard and require further balanced content.
10. Quality gate: independently review factual answers, remove ambiguous distractors, verify coding cases and time limits, and never imply these are verified Capgemini exam questions.
