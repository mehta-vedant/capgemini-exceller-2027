# Question-bank methodology

Each item has a stable ID, module, topic, subtopic, difficulty, source ID,
provenance label, explanation, estimated time, and validation state.

The bank is authored as structured TypeScript data and validated by
`npm run validate:data`. The app deliberately does not render upstream Markdown
files. Instead, useful instructional patterns are converted into interactive
questions, timed drills, code challenges, prompt-workspace tasks, and review
feedback.

Validation checks require a unique ID, four options, a valid correct option,
explanation metadata, source references, module totals, and challenge tests.
