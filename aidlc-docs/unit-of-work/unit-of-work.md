# Unit of Work

Monorepo with npm/pnpm workspaces (Q1 code-org). Python for AI/pipeline Lambdas, TypeScript for API/WebSocket + frontend (Q2 code-org). Shared `/shared/contracts` (Q3 code-org).

| Unit | Name | Scope | Primary dir | Language |
|------|------|-------|-------------|----------|
| U0 | Pre-flight | SageMaker triggers, Bedrock check, seed, CDK bootstrap, contracts freeze | `aidlc-docs`, `seed` | — |
| U1 | Infrastructure | 6 CDK stacks | `infrastructure/` | TypeScript |
| U2 | Vision pipeline | validate, segmentation, depth, geometry | `lambda/ai-analyzer` | Python |
| U3 | Reasoning + 3D gen | pinterest, bedrock_reason, asset gen | `lambda/ai-analyzer` | Python |
| U4 | API + WebSocket + orchestration | REST router, WS handlers, Step Functions | `backend/`, `lambda/upload-processor` | Py + TS |
| U5 | Search + commerce | OpenSearch seeding, furniture search, products | `backend/services`, `seed` | Python |
| U6 | Frontend editor | Next.js app, Zustand, R3F editor, AR | `frontend/` | TypeScript |
