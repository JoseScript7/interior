# Seeley — Technology Stack

## Frontend
- Framework: Next.js 14 (App Router) + TypeScript
- 3D Engine: Three.js + @react-three/fiber + @react-three/drei
- AR: model-viewer web component (Google) for WebXR
- Styling: Tailwind CSS + shadcn/ui
- State: Zustand
- File upload: react-dropzone → S3 presigned URL

## Backend
- Runtime: Python 3.11 + FastAPI
- Deployed: AWS Lambda (via Mangum adapter) + API Gateway
- Auth: Amazon Cognito (User Pools)

## AWS Services (ALL required for hackathon demo)
- Amazon S3: room images, renders, 3D model assets
- Amazon CloudFront: CDN for 3D assets and app
- Amazon Cognito: user auth
- Amazon API Gateway: REST + WebSocket APIs
- AWS Lambda: serverless processing functions
- Amazon Bedrock (claude-sonnet-4-6): room analysis, recommendations
- Amazon Rekognition: object/scene detection in room photos
- Amazon SageMaker: ControlNet SD render endpoint, TripoSR 3D endpoint
- Amazon OpenSearch Serverless: vector search for furniture matching
- Amazon DynamoDB: user projects, design state
- Amazon SQS: async render job queue

## Open Source Foundations (already built, we integrate)
- VAST-AI-Research/TripoSR: product image → 3D mesh (on SageMaker, fallback only)
- isl-org/MiDaS: depth estimation for ControlNet conditioning
- lllyasviel/ControlNet: structure-preserving room redesign

## Environment Variables (never commit values)
AWS_REGION, AWS_ACCOUNT_ID, BEDROCK_MODEL_ID,
S3_BUCKET_NAME, OPENSEARCH_ENDPOINT, COGNITO_USER_POOL_ID,
SAGEMAKER_CONTROLNET_ENDPOINT, SAGEMAKER_TRIPOSR_ENDPOINT
