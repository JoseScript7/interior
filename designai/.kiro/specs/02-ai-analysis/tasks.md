# Tasks — AI Room Analysis

- [x] 1. Prompt templates (system/context/user) in `backend/prompts`
- [x] 2. `analyze.py` Bedrock Converse multimodal call (temp 0.8, 3 alts)
- [x] 3. `bedrock_reason.py` pipeline stage + DynamoDB persistence
- [x] 4. `RecommendationPanel` with theme cards + color swatches
- [x] 5. `PipelineProgress` indicator component
- [ ] 6. WebSocket subscription hook on frontend (consume `pipeline_progress` / `pipeline_complete`)
- [ ] 7. Guardrail retry path: validate JSON → retry with schema-bound prompt
- [ ] 8. Unit tests: JSON parsing, fence-stripping, retry trigger
- [ ] 9. Integration test: SQS message → recommendations stored → WS pushed
