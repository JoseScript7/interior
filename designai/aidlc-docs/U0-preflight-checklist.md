# U0 — Pre-Flight Checklist (Minute Zero)

Run these in parallel at the very start; several have long lead times.

- [ ] **Bedrock model access** — run `python -m scripts.preflight_bedrock` and confirm PASS (Claude Sonnet + Titan ACTIVE). Missing access looks like an IAM error — verify here first.
- [ ] **Trigger SageMaker endpoints** — deploy AiStack first; **set min=1 for the demo window** (scale-to-zero = 8–15 min cold wake on stage, ~$2.65/hr per g4dn endpoint).
- [ ] **Custom containers** — SAM2/Depth/Qwen are NOT in AWS DLCs; build + push images to ECR first, reference those URIs in AiStack (2–4h/model — template ahead).
- [ ] **Model artifacts** — download weights → convert → upload `model.tar.gz` to S3 → register as SageMaker Model (30–60 min/model). Required before endpoints start.
- [ ] **Image payloads** — pipeline passes images as **S3 URIs** to SageMaker (6MB payload limit), never base64 in the body.
- [ ] **Step Functions timeouts** — each GPU state has `TimeoutSeconds >= 120`.
- [ ] **PA-API** — not used; confirm sample-data fallback (`seed/products.json`).
- [ ] **Seed assets bucket** — upload sample GLBs to `designai-assets-{acct}` (Poly Haven / Sketchfab free tier).
- [ ] **Freeze API contracts** — `shared/contracts/json/*.json`, `websocket/messages.json`, `stepfunctions/design-pipeline.asl.json` ✅ (done).
- [ ] **OpenSearch Serverless** — confirm `furniture-catalog` VECTORSEARCH collection provisioned; index `furniture-index` with mapping.
- [ ] **CDK bootstrap** — `cdk bootstrap aws://<acct>/us-east-1`.
- [ ] **.env files** — create `frontend/.env.local` and `backend/.env` from `.env.example` with all variable names.
- [ ] **Replace placeholders** — set `accountId` in `infrastructure/cdk.json`.

## Deploy command sequence
```bash
cd infrastructure && npm install
npx cdk bootstrap
npx cdk deploy designai-network designai-ai   # start SageMaker warm-up first
npx cdk deploy designai-data designai-auth
npx cdk deploy designai-api designai-pipeline
```

## Seed command (after DataStack)
```bash
cd backend && python -m scripts.seed_opensearch ../seed/products.json
```
