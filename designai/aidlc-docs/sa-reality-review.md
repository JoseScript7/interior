# SA Reality Review & Descope Decisions

Senior-SA review of the SAD against real-world AWS/ML constraints. Each item is either **applied**, **additive (build now)**, or **needs confirmation (destructive to existing code)**.

## 1. Pinterest integration → generic inspiration upload
- **Problem:** Pinterest API v5 needs OAuth app approval (weeks), only reads the authed user's own boards, can't fetch arbitrary URLs; scraping violates ToS.
- **Decision:** Drop "Pinterest" as a named integration. Feature = "upload any inspiration image." Qwen2.5-VL + CLIP path is identical regardless of source.
- **Status:** Needs confirmation (doc + UI label changes; low code risk).

## 2. Image-to-3D model/GPU mismatch
- **Problem:** TRELLIS / Hunyuan3D-2 need A100/H100 (40GB+ VRAM); g4dn.xlarge (T4, 16GB) OOMs or runs 10+ min. Weights are 12–20GB and have no acquisition/upload step.
- **Decision:** Catalog-first (200–500 CC0 GLBs from Poly Haven/Sketchfab). TripoSR (4–8s on g4dn) as genuine fallback only. Move model-weight download + S3 upload into **U0**.
- **Status:** Needs confirmation (removes live TRELLIS/Hunyuan from scope).

## 3. AR = three separate problems
- **A — iOS has no WebXR.** iOS Safari = AR Quick Look (.usdz) via model-viewer; WebXR immersive-ar = Android Chrome only. Two code paths required.
- **B — Depth Anything V2 = relative depth, not metric.** Needs a calibration anchor (standard door = 2.03m, or credit card = 85.6mm) to derive depth-per-pixel scale. See `scripts/metric_scale.py`.
- **C — No lighting estimation = fake-looking AR.** Use Three.js PMREMGenerator with an env map derived from the room photo.
- **Status:** A & C documented; B built (additive util).

## 4. SageMaker — five landmines
1. Custom containers must be built + pushed to ECR first (SAM2/Depth/Qwen not in AWS DLCs). 2–4h/model — template ahead.
2. Scale-to-zero = 8–15 min cold wake. **For demo window set min=1** (~$2.65/hr).
3. Model artifact prep (download → convert → S3 → register) — 30–60 min/model, must be in U0.
4. Step Functions GPU states need explicit `TimeoutSeconds >= 120`.
5. SageMaker payload limit 6MB req/resp → pass images as **S3 URIs, not base64**.
- **Status:** #2/#4/#5 applied to U0 + ASL guidance; #1/#3 added to U0.

## 5. API Gateway / Lambda payload limits
- REST API ≤ 10MB → never return GLB through API; use CloudFront/S3 signed URLs.
- WebSocket frame ≤ 128KB → status + URLs only; large scene descriptors fetched via REST after WS notify.
- Python AI Lambda cold start 3–8s → Provisioned Concurrency on critical path for demo.
- **Status:** Applied as constraints (already true in code: presigned URLs, WS carries URLs).

## 6. Metric depth/scale — the hidden demo killer
- Without metric scale, furniture renders at random sizes. Anchor-based calibration (door/credit-card). 30-line calc. See `scripts/metric_scale.py`.
- **Status:** Built (additive).

## 7. GLB normalization
- Free GLBs use inconsistent unit scales (cm vs m). Normalize via glTF-Transform; scale longest dim to real-world metadata; store `realWorldDimensions` in OpenSearch. One-time batch before demo. See `scripts/normalize_glb.md`.
- **Status:** Procedure documented (additive); needs glTF-Transform CLI + binaries (human/wall-clock).

## 8. Bedrock model enablement blocks everything
- Models are NOT enabled by default; missing access → AccessDeniedException that looks like IAM.
- **Enforcement:** U0 preflight script calls `bedrock:ListFoundationModels` and verifies each required model ACTIVE before deploy. See `scripts/preflight_bedrock.py`.
- **Status:** Built (additive).

## 9. Three.js / R3F realities
- Progressive GLB loading (thumbnails first, full GLB on select).
- `Box3.setFromObject()` after every transform incl. rotation (collision correctness).
- Dispose geometry/material/textures on item removal (memory leak → tab crash in long demo).
- 60fps needs frustum culling, instancing, Suspense + low-poly placeholders; 30fps realistic otherwise.
- **Status:** Captured as editor implementation requirements (tasks added to spec 03).

## 10. Recommended descope (14h to protect the demo)
**Cut:** live 3D gen (TRELLIS/Hunyuan), Pinterest named integration, desktop WebXR, Redis, multi-AZ OpenSearch, ControlNet render → **Nova Canvas** instead.
**Simplify:** Step Functions 5 states, 2 SageMaker endpoints (SAM2 + Depth), 30 pre-normalized GLBs, single Bedrock call, 3 WS message types.
- **Status:** Needs confirmation — several reverse code already built (render worker, SDXL/ControlNet, Redis in DataStack, 6-stage pipeline).
