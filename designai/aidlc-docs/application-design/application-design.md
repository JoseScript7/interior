# Application Design (Summary)

DesignAI is an event-driven, serverless AWS application that turns a room photo into an editable 3D digital twin with AI recommendations and commerce.

## Locked decisions
- **Q1** Single canonical scene descriptor JSON in Zustand.
- **Q2** Hybrid Lambda granularity (fine for pipeline, coarse for REST).
- **Q3** JSON Schema draft-07 + ajv (TS) + Pydantic (Py).
- **Q4** Single Standard Step Functions state machine.
- **Q5** Async 3D generation with placeholders, swap-in via WebSocket.
- **Q6** Assistant actions map to the same Zustand mutations as manual edits.
- **Q7** Login required, no guest mode.
- **Functional Q1** Bounding-box collision detection.
- **Functional Q2** Single Bedrock call, temp=0.8, 3 alternatives.
- **Functional Q3** Two-stage retrieval (vector k=20 → keyword re-rank).

See: `components.md`, `component-methods.md`, `services.md`, `component-dependency.md`, `api-contracts.md`.
