# DesignAI API Reference

REST API for the DesignAI platform (FastAPI + Mangum on AWS Lambda).

- Base path in local dev: `http://localhost:8000`
- All endpoints return JSON.
- Image uploads are capped at 10MB.

> Auto-generated/maintained by the `docs-sync` hook. Sections are dated when updated.

## Router Map

| Prefix      | Domain                     |
|-------------|----------------------------|
| `/local`    | Local Mode (Path C)        |
| `/upload`   | Upload (S3 presigned)      |
| `/project`  | Project CRUD               |
| `/recommend`| AI Recommendations         |
| `/render`   | Photorealistic render      |
| `/assets`   | Furniture search           |
| `/scene`    | Scene descriptor save/load |

---

## Health

### GET `/health`
Returns service health.

**Response**
```json
{ "status": "healthy", "service": "designai-api" }
```

---

## Local Mode (Path C) — `/local`

_Updated: 2026-06-26_

Real Bedrock-backed AI with no AWS infrastructure dependency. Images are sent
directly to Bedrock (base64) and projects are persisted to the local filesystem
(`backend/.data/`) instead of DynamoDB.

### POST `/local/analyze`
Upload a room photo and receive real Bedrock room analysis plus 3 design
recommendations.

**Request** — `multipart/form-data`

| Field      | Type   | Required | Notes                          |
|------------|--------|----------|--------------------------------|
| `image`    | file   | yes      | Room photo, max 10MB           |
| `roomType` | string | no       | Optional room-type override    |

**Response** `200`
```json
{
  "projectId": "<uuid>",
  "analysis": {
    "roomType": "living_room",
    "estimatedDimensions": { "width": 0, "length": 0, "height": 0 },
    "currentStyle": "<style>",
    "lightingQuality": "good",
    "detectedObjects": ["..."],
    "colorPalette": ["#hex", "#hex", "#hex", "#hex", "#hex"],
    "designRecommendations": [ { "theme": "...", "type": "closest_to_inspiration", "...": "..." } ]
  },
  "recommendations": [ { "theme": "...", "type": "budget_optimized", "...": "..." } ]
}
```

**Errors**
- `400` — Image exceeds 10MB.
- `502` — Bedrock error or unparseable AI response.

### GET `/local/recommend`
Fetch stored analysis + recommendations for a project.

**Query params:** `project_id` (string, required)

**Response** `200`
```json
{ "analysis": { "...": "..." }, "recommendations": [ { "...": "..." } ] }
```

**Errors:** `404` — Project not found.

### GET `/local/project/{project_id}`
Return the full stored project record (includes the original image as a base64
data URI and any saved scene descriptor).

**Response** `200`
```json
{
  "projectId": "<uuid>",
  "roomType": "<string>",
  "analysis": { "...": "..." },
  "recommendations": [ { "...": "..." } ],
  "imageBase64": "data:image/jpeg;base64,...",
  "createdAt": "<iso8601>",
  "status": "recommendations_ready"
}
```

**Errors:** `404` — Project not found.

### POST `/local/scene`
Save a scene descriptor for a project.

**Request** — `application/json`
```json
{ "project_id": "<uuid>", "scene_descriptor": { "...": "..." } }
```

**Response** `200`
```json
{ "message": "saved", "project_id": "<uuid>" }
```

**Errors:** `400` — `project_id` missing.

---

## Upload — `/upload`

### POST `/upload/`
Generate a presigned S3 PUT URL for direct browser-to-S3 upload and create the
project record.

**Request** — `application/json`
```json
{
  "filename": "room.jpg",
  "content_type": "image/jpeg",
  "room_type": "living_room",
  "budget": 5000,
  "style": "scandinavian"
}
```
`content_type` must be one of `image/jpeg`, `image/png`, `image/webp`.

**Response** `200`
```json
{ "project_id": "<uuid>", "upload_url": "<presigned-url>", "image_key": "users/uploads/<uuid>/room.jpg" }
```

**Errors:** `400` — Disallowed file type.

### POST `/upload/complete`
Notify the backend that the S3 upload finished; triggers the analysis pipeline.

**Request** — `application/json`
```json
{ "project_id": "<uuid>", "image_key": "users/uploads/<uuid>/room.jpg" }
```

**Response** `200`
```json
{ "message": "Analysis pipeline triggered", "project_id": "<uuid>" }
```

---

## Project — `/project`

### GET `/project/`
List the current user's projects (most recent first, max 20).

**Response** `200`
```json
{ "projects": [ { "...": "..." } ] }
```

### GET `/project/{project_id}`
Get a single project.

**Response:** `200` project data object. **Errors:** `404` — Project not found.

### DELETE `/project/{project_id}`
Delete a project.

**Response** `200`
```json
{ "message": "Project deleted", "project_id": "<uuid>" }
```

---

## Recommendations — `/recommend`

### GET `/recommend/`
Get AI recommendations for a project. If none exist yet, runs Bedrock analysis
on the project's uploaded image and stores the result.

**Query params:** `project_id` (string, required)

**Response** `200`
```json
{ "recommendations": [ { "...": "..." } ], "analysis": { "...": "..." } }
```

**Errors:**
- `400` — No image uploaded for this project.
- `404` — Project not found.
- `500` — AI returned an invalid response format.

---

## Render — `/render`

### POST `/render/`
Trigger the photorealistic render pipeline (async via SQS).

**Request** — `application/json`
```json
{ "project_id": "<uuid>", "selected_theme": "scandinavian", "scene_json": { "...": "..." } }
```

**Response** `200`
```json
{ "job_id": "<uuid>", "status": "queued", "message": "Rendering... this takes about 45 seconds" }
```

### GET `/render/{job_id}`
Check render job status.

**Response** `200`
```json
{ "job_id": "<uuid>", "status": "processing", "progress": 0, "message": "Render in progress" }
```

---

## Furniture — `/assets`

### GET `/assets/`
Two-stage furniture retrieval: vector search (k=20) then keyword re-rank.

**Query params**

| Param       | Type   | Required | Notes                        |
|-------------|--------|----------|------------------------------|
| `query`     | string | yes      | e.g. `teak dining table`     |
| `category`  | string | no       | Filter by category           |
| `max_price` | float  | no       | Max price filter             |
| `limit`     | int    | no       | 1–10, default 3              |

**Response** `200`
```json
{
  "query": "teak dining table",
  "results": [
    {
      "product_id": "sofa-001",
      "name": "Scandinavian Oak Sofa",
      "category": "sofa",
      "style": "scandinavian",
      "material": "oak wood, linen",
      "color": "beige",
      "price": 899.0,
      "image_url": "...",
      "product_url": "...",
      "glb_url": null,
      "dimensions": { "width": 200, "depth": 85, "height": 80 },
      "score": 0.95
    }
  ],
  "total": 1
}
```

---

## Scene — `/scene`

### POST `/scene/`
Save the canonical scene descriptor to DynamoDB (auto-increments `metadata.version`).

**Request** — `application/json`
```json
{ "project_id": "<uuid>", "scene_descriptor": { "metadata": { "version": 1 }, "...": "..." } }
```

**Response** `200`
```json
{ "message": "Scene saved", "version": 2 }
```

### GET `/scene/`
Load the scene descriptor for a project.

**Query params:** `project_id` (string, required)

**Response** `200`
```json
{ "scene_descriptor": { "...": "..." } }
```

**Errors:**
- `404` — Project not found.
- `404` — No scene data for this project.
