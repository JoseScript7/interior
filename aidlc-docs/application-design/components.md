# Components

## Frontend (Next.js)
| Component | Responsibility |
|-----------|----------------|
| UploadPage | Dropzone, presigned-URL upload, progress bar |
| ProjectPage | Orchestrates editor + recommendations + pipeline progress |
| RoomEditor | React Three Fiber canvas, room walls/floor, orbit controls |
| FurnitureObject | Per-item mesh, bounding-box collision, selection |
| FurnitureCatalogPanel | Search/filter catalog, add to scene |
| PropertiesPanel | Color/scale/rotate/delete for selected item |
| EditorToolbar | View toggle, undo/redo, save, render, AR |
| RecommendationPanel | 3 theme cards, apply theme |
| PipelineProgress | Stage/percent indicator |
| ARPreview | model-viewer (mobile) / WebXR (desktop) / fallback |
| BeforeAfterSlider | Render comparison |
| ProductCard | Commerce card (add to scene / Amazon link) |

## Backend (FastAPI)
| Module | Responsibility |
|--------|----------------|
| api/upload | Presigned URLs, project creation, trigger analysis |
| api/project | CRUD |
| api/analyze | Bedrock room analysis + 3 recommendations |
| api/render | Render job queueing |
| api/furniture | Two-stage furniture search |
| api/scene | Scene descriptor save/load |
| services/bedrock | Converse API wrapper + retry |
| services/opensearch | Vector + keyword hybrid search |

## Pipeline Lambdas
validate, segmentation, depth, pinterest, bedrock_reason, asset_retrieval, scene_assembly, persist, notify, ws_handler.
