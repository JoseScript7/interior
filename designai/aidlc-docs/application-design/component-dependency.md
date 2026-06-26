# Component Dependency

```
NetworkStack
   └── DataStack (VPC for Redis)
   └── AiStack (VPC for SageMaker)
AuthStack (independent)
ApiStack ── depends on ── AuthStack (userPool), DataStack (table+buckets)
PipelineStack ── depends on ── DataStack (table+buckets), AiStack (endpoints)

Frontend ── calls ── ApiStack REST + WebSocket
ApiStack Lambdas ── write ── SQS ── trigger ── PipelineStack
PipelineStack ── invokes ── Bedrock + SageMaker, writes DynamoDB, notifies WebSocket
shared/contracts ── consumed by ── Frontend (ajv) + Backend (Pydantic)
```

Deploy order: Network → (Auth ‖ Data ‖ Ai) → Api → Pipeline.
