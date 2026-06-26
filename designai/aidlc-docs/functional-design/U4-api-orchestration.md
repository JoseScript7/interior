# U4 — API, WebSocket & Orchestration Functional Design

## REST routing
Coarse-grained FastAPI router (Mangum) — one Lambda, routers per domain (upload/project/analyze/render/furniture/scene). Cognito authorizer on all routes.

## WebSocket lifecycle
- `$connect` → store `WS#<connId>` in DynamoDB.
- `$disconnect` → delete connection.
- Server push via `apigatewaymanagementapi.post_to_connection`; GoneException → cleanup.

## Step Functions ASL
`shared/contracts/stepfunctions/design-pipeline.asl.json`. Validate → Parallel[Segment,Depth] → HasInspiration(Choice) → [Pinterest] → Bedrock → Retrieval → AssetGenerationChoice → [GeneratePlaceholders] → SceneAssembly → Persist → Notify. Retries with backoff per state; Catch → PipelineFailed.

## Event fanout
EventBridge rule on uploads-bucket ObjectCreated → start state machine. SQS analysis-jobs + render-jobs decouple API from long tasks.
