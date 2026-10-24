# Evidence register

The runtime source of truth is [`src/data/evidence.ts`](../src/data/evidence.ts). Each record includes URL, publication and assessment dates where known, package/role qualifier, firsthand status, confidence, topics, format, and verification notes.

Confidence levels:

- **Official**: employer or college material supplied by the learner.
- **Repeated firsthand**: multiple independent candidate narratives align on a broad point.
- **Single firsthand**: one candidate narrative; useful but not generalized.
- **Preparation inference**: an app-design response to the evidence, never an employer claim.
- **Unverified**: deliberately retained as an unresolved item.
