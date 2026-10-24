# Developer integration spec

1. Import `questions.json` into a question storage layer, preserving provenance, exact answer identifier, and explanation. Keep answers server-side for exam mode.
2. Build separate 20-question random AI and Technical pools; combined timed test 40 questions in approx 45 minutes.
3. Add filters by topic and difficulty; allow practice mode immediate explanations, exam mode explanations post-submission.
4. Debugging tasks are `cpp17`: show `starter_code` editor; compile/execute through sandbox runner; compare exact stdout (trim trailing whitespace if intended). Restrict CPU, memory, network and filesystem.
5. `public_tests` can be visible during practice; `hidden_tests` and `reference_solution` must remain server-side.
6. AI coding tasks contain a prompt-scaffolding workflow and weighted rubric; real model use requires configured provider. Offline presets must be visibly simulated.
7. Logical/communication entries are short-form; do not inject as MCQs without adding validated plausible distractors.
8. Tag all resources "original practice, not official questions." Sources in RESEARCH.md apply to topic selection only, not authenticity of individual questions.
9. Ensure dataset deduplication, correctness checks, test execution, and provenance filters in the import pipeline.
10. The upstream cloned GitHub repository is a separate source. Compare/de-duplicate its materials before merging.
