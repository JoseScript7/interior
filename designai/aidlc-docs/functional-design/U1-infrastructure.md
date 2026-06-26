# U1 — Infrastructure Functional Design

## Stacks & provisioning order
1. **NetworkStack** — VPC 10.0.0.0/16, public/private/isolated subnets across 2 AZs, 1 NAT, S3 + DynamoDB gateway endpoints.
2. **DataStack** — 3 S3 buckets (uploads/renders/assets), CloudFront for assets, DynamoDB single-table + GSI1(status) + GSI2(date), ElastiCache Redis (cache.t3.micro, isolated subnets).
3. **AuthStack** — Cognito User Pool (email, no MFA), web client (SRP + password), token validity 1h/1h/30d.
4. **AiStack** — SageMaker Model+EndpointConfig+Endpoint for ControlNet (ml.g4dn.xlarge), MiDaS (ml.m5.xlarge), TripoSR (ml.g4dn.xlarge); autoscaling min=0/max=1, scale-in 5 min.
5. **ApiStack** — REST API Gateway + Cognito authorizer, coarse router Lambda, WebSocket API (connect/disconnect), SQS analysis-jobs (5 min) + render-jobs (15 min) with DLQs.
6. **PipelineStack** — Step Functions Standard state machine, EventBridge rule on S3 ObjectCreated, 9 stage Lambdas, least-privilege role.

## Resource provisioning notes
- SageMaker endpoints must be triggered at minute zero (U0) — ~5 min warm-up.
- All buckets SSE; assets bucket fronted by CloudFront OAC.
- Container image URIs pinned to `763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-inference`.
