# DesignAI — AI-Powered Home Interior Visualization Platform

> Upload any room photo → Get AI design recommendations → Visualize furniture in 3D/AR → Purchase real products

Built for **AWS Student Builder Hackathon 2025** using Kiro spec-driven development.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Three.js + WebXR
- **Backend**: Python 3.11 FastAPI on AWS Lambda (Mangum)
- **Infrastructure**: AWS CDK v2 (6 stacks)
- **AI**: Amazon Bedrock (Claude), Rekognition, SageMaker (ControlNet, MiDaS, TripoSR)
- **Data**: DynamoDB, S3, OpenSearch Serverless, ElastiCache
- **Orchestration**: Step Functions, EventBridge, SQS

## Key Design Decisions

| Decision | Choice |
|----------|--------|
| Scene State | Single canonical JSON in Zustand (Q1) |
| Lambda Granularity | Hybrid — fine for pipeline, coarse for API (Q2) |
| Contracts | JSON Schema + ajv + Pydantic (Q3) |
| Orchestration | Single Standard Step Functions state machine (Q4) |
| 3D Models | Async with placeholders via WebSocket swap (Q5) |
| Assistant | Structured action commands → Zustand mutations (Q6) |
| Auth | Login required, no guest mode (Q7) |
| Collision | Bounding box overlap check (Functional Q1) |
| Bedrock | Single call, temperature=0.8, 3 alternatives (Functional Q2) |
| Search | Two-stage: vector k=20 → keyword re-rank (Functional Q3) |

## Quick Start

```bash
# Infrastructure
cd infrastructure && npm install && npx cdk deploy --all

# Backend (local)
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Project Structure

```
designai/
├── .kiro/            → Specs, steering, hooks (required for judging)
├── frontend/         → Next.js 14 App Router
├── backend/          → Python FastAPI (Lambda)
├── infrastructure/   → AWS CDK v2 (6 stacks)
├── lambda/           → Pipeline stage functions
└── shared/           → JSON Schema contracts
```

## AWS Services Used

S3, CloudFront, Cognito, API Gateway (REST + WebSocket), Lambda, Bedrock, Rekognition, SageMaker, OpenSearch Serverless, DynamoDB, SQS, Step Functions, EventBridge, CloudWatch, CDK
