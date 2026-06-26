# Component Methods

## Zustand Scene Store (`scene-store.ts`)
| Method | Signature | Notes |
|--------|-----------|-------|
| loadScene | (scene) => void | Resets undo/redo |
| addItem | (item) => void | Pushes undo entry |
| removeItem | (itemId) => void | |
| updateItemPosition | (id, Point3D) => void | |
| updateItemRotation | (id, Point3D) => void | |
| updateItemScale | (id, Point3D) => void | |
| updateItemColor | (id, string) => void | |
| swapItem | (id, replacement) => void | Preserves position/rotation |
| setTheme | (theme) => void | |
| undo / redo | () => void | |
| dispatchAssistantAction | (AssistantAction) => void | Q6 — one code path for manual + AI edits |

## services/bedrock.py
- `converse(system, content, max_tokens, temperature)` — retry x2
- `converse_with_image(...)` — multimodal
- `generate_embedding(text)` — Titan 1536-dim

## services/opensearch.py
- `vector_search(embedding, k=20, category_filter)` — stage 1
- `keyword_rerank(candidates, keywords)` — stage 2
- `hybrid_search(embedding, keywords, limit=3)` — combined (Functional Q3)
