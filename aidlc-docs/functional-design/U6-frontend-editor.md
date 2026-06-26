# U6 — Frontend Editor Functional Design

## Zustand store (Q1, Q6)
Single `SceneDescriptor` state + `selectedItemId`, `undoStack`, `redoStack`, `isDirty`. All mutations push undo entries. `dispatchAssistantAction` routes AI actions through the same mutation functions as manual edits.

## 3D interaction system
- React Three Fiber `RoomEditor`: orbit controls, floor grid, wall meshes, lighting, Environment preset.
- `FurnitureObject`: placeholder Box mesh (swapped for GLB on `asset_ready`), hover/select highlight.
- **Collision (Functional Q1)**: Box3 bounding-box overlap test on drag; snap to nearest non-overlapping position on release; red highlight while overlapping (degraded fallback = visual warning).

## UI state machines
- Upload: idle → uploading(progress) → complete → redirect.
- Pipeline: subscribe WebSocket `pipeline_progress` → `PipelineProgress` stages.
- Render: trigger → progress → `render_complete` → `BeforeAfterSlider`.
- Catalog/Properties/Toolbar wired to store; keyboard shortcuts Cmd+Z/Cmd+Shift+Z/Cmd+S.
