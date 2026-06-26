# U3 — Reasoning & 3D Generation Functional Design

## Bedrock prompt engineering (Functional Q2)
- Three-layer prompts (`backend/prompts/system_prompts.py`): System (persona + JSON-only + safety), Context (geometry/style/budget slots), User (3-alternative request).
- Single Converse call, temperature=0.8, maxTokens=4096, returns 3 typed alternatives in one JSON.
- Markdown-fence stripping + JSON parse; on parse failure → guardrail retry prompt.

## Guardrails (FR15)
- JSON schema validation against `rest-api.json#/definitions/DesignRecommendation`.
- Safety rules in system prompt: no wall removal, no blocked exits, no impossible placement.
- Invalid output → automatic retry with `GUARDRAIL_RETRY_SYSTEM`.

## 3D generation pipeline (Q5)
- Retrieval-first (U5). If asset missing → placeholder mesh now, async TRELLIS/Hunyuan generation.
- On completion → upload GLB to assets bucket → WebSocket `asset_ready {projectId,itemId,glbUrl}` → store swaps placeholder.
