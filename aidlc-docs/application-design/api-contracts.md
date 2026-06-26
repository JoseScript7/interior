# API Contracts (Frozen)

Source of truth: `shared/contracts/json/*.json` (draft-07), consumed by ajv (TS) and Pydantic (Py) via `loader.py` / `index.ts`.

## REST Endpoints (v1)

| Method | Path | Request schema | Response schema | Auth |
|--------|------|----------------|-----------------|------|
| POST | /v1/upload | `UploadRequest` | `UploadResponse` | Cognito |
| POST | /v1/upload/complete | `{projectId, imageKey}` | `{message, projectId}` | Cognito |
| POST | /v1/project | `ProjectCreateRequest` | `ProjectResponse` | Cognito |
| GET | /v1/project | — | `{projects: ProjectResponse[]}` | Cognito |
| GET | /v1/project/{id} | — | `ProjectResponse` | Cognito |
| DELETE | /v1/project/{id} | — | `DeleteResponse` | Cognito |
| POST | /v1/style | `StyleRequest` | `{message}` | Cognito |
| POST | /v1/render | `RenderRequest` | `RenderResponse` | Cognito |
| GET | /v1/render/{jobId} | — | `RenderResponse` | Cognito |
| GET | /v1/recommend?project_id= | — | `RecommendationsResponse` | Cognito |
| GET | /v1/assets?query=&category=&limit= | — | `{results: FurnitureCatalogItem[]}` | Cognito |
| POST | /v1/scene | `SaveSceneRequest` | `{message, version}` | Cognito |
| GET | /v1/scene?project_id= | — | `{scene_descriptor: SceneDescriptor}` | Cognito |

## WebSocket Messages
Single channel (`messages.json`): `pipeline_progress`, `pipeline_complete`, `render_complete`, `render_timeout`, `asset_ready` (async 3D swap-in), `assistant_action`.

## Step Functions I/O
Defined in `shared/contracts/stepfunctions/design-pipeline.asl.json`. Each state passes the accumulating execution object; vision results land under `$.visionResults`, recommendations under `$.recommendations`, assets under `$.assets`, final scene under `$.scene`.

## Scene Descriptor
`shared/contracts/json/scene-descriptor.json` — the single canonical JSON written by the pipeline and read/mutated by the Zustand store.
