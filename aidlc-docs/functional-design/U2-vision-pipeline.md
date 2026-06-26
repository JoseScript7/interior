# U2 — Vision Pipeline Functional Design

## Stages
- **validate.py** — head S3 object; check content-type ∈ {jpeg,png,webp}, size ≤ 10MB. Fail closed.
- **segmentation.py** — Rekognition DetectLabels (MaxLabels 30, MinConfidence 70). Categorize furniture vs room features. (SAM2 endpoint in production.)
- **depth.py** — invoke MiDaS SageMaker endpoint → depth map + estimated dimensions. Fallback to default dims on failure.
- **geometry** — (future) OpenCV wall/corner refinement.

## Output parsing
Each stage returns `{projectId, status, ...}`. Parallel branch results land in `$.visionResults[0]` (segmentation) and `[1]` (depth).

## Fallback logic
- Rekognition error → empty label set, continue.
- MiDaS timeout → default {w:4.0, l:5.0, h:2.7}, status=`fallback`.
