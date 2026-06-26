# Design — AI Room Analysis

## Architecture
```
SQS analysis-jobs ──► bedrock_reason Lambda ──► Bedrock Converse (Claude, temp 0.8)
                                          └──► DynamoDB (recommendations) ──► WebSocket notify
```

## Prompt layers (Functional Q2)
`backend/prompts/system_prompts.py`: System (persona + JSON-only + safety), Context (geometry/style/budget), User (3-alternative JSON shape). Single call.

## Output validation (FR15 guardrails)
Strip markdown fences → JSON parse → schema check against `DesignRecommendation`. On failure → `GUARDRAIL_RETRY_SYSTEM`.

## Frontend
`RecommendationPanel` (3 theme cards + swatches + Apply), `PipelineProgress` (stage/percent), WebSocket subscription.

## Contracts
`RecommendationsResponse`, `RoomAnalysis`, `DesignRecommendation` in `rest-api.json`.
