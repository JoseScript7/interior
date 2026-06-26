# Design — 3D Room Editor

## State (Q1, Q6)
Zustand `SceneDescriptor` is the single source. Manual edits and assistant actions call the same mutations (`dispatchAssistantAction`).

## Components
- `RoomEditor` (R3F canvas, orbit, grid, walls, lighting)
- `FurnitureObject` (placeholder Box → GLB swap on `asset_ready`; bounding-box collision)
- `FurnitureCatalogPanel`, `PropertiesPanel`, `EditorToolbar`

## Collision (Functional Q1)
Box3 overlap test per drag frame; snap to nearest valid position on release; red highlight while overlapping; visual-warning fallback when no valid position.

## Persistence
`POST /scene` → DynamoDB; version increments in metadata. Undo/redo via store stacks.

## Contracts
`SceneDescriptor` (`scene-descriptor.json`), `SaveSceneRequest`.
