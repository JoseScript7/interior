# Services

| Service | AWS Backing | Purpose |
|---------|-------------|---------|
| Auth | Cognito User Pool + Client | Login-required (Q7) |
| Storage | S3 (uploads/renders/assets) + CloudFront | Images, renders, GLB assets |
| Metadata | DynamoDB single-table + 2 GSIs | Projects, scenes, WS connections |
| Cache | ElastiCache Redis | Session/recommendation cache |
| Search | OpenSearch Serverless (VECTORSEARCH) | Furniture vector + keyword retrieval |
| Reasoning | Bedrock (Claude Sonnet) | Room analysis, 3 alternatives, assistant |
| Vision | SageMaker (SAM2/Depth/Qwen via ControlNet/MiDaS/TripoSR endpoints) | Segmentation, depth, 3D gen |
| Orchestration | Step Functions + EventBridge | Async pipeline |
| Messaging | SQS (analysis-jobs, render-jobs) + WebSocket API | Job queueing + realtime |
