# AWS Configuration Context

## Region
Primary: us-east-1 (Bedrock Claude available here)

## Bedrock
- Model: Claude Sonnet 4.6 via inference profile `us.anthropic.claude-sonnet-4-6` (bare model id is NOT on-demand invocable; must use the inference profile)
- Embeddings: `amazon.titan-embed-image-v1` returns **1024-dim** vectors (OpenSearch knn mapping must match)
- Use converse API (not invoke) for multimodal image+text calls
- Always include system prompt before user messages
- Max tokens: 4096 for analysis, 1024 for recommendations

## S3 Bucket Naming
- seeley-uploads-{accountId}: raw room photos
- seeley-renders-{accountId}: AI generated images
- seeley-assets-{accountId}: 3D models, textures (public via CloudFront)

## Lambda Patterns
- Use Mangum for FastAPI→Lambda adapter
- Always use Lambda Powertools for logging and tracing
- Set reserved concurrency = 10 on expensive AI lambdas

## IAM Principle
- Least privilege on every Lambda execution role
- Never use AdministratorAccess in any role
- Bedrock: allow only bedrock:InvokeModel on specific model ARN

## Cost Guard
- SageMaker endpoints: use ml.g4dn.xlarge (cheapest GPU)
- Auto-scaling: min=0, max=1 — cold start is acceptable for hackathon
- OpenSearch Serverless: 1 OCU minimum (cheapest option)
