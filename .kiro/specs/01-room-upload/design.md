# Design — Room Upload & Authentication

## Architecture
```
Browser ──(presigned PUT)──► S3 uploads bucket ──(ObjectCreated)──► EventBridge ──► Step Functions
   │                                                                                      
   └──(POST /upload)──► API Gateway ──► Lambda(upload.py) ──► DynamoDB (project record)
```

## Components
- `frontend/app/upload/page.tsx` — react-dropzone, presigned PUT, progress.
- `backend/api/upload.py` — `POST /upload` (presigned URL + project record), `POST /upload/complete` (SQS + status).
- AuthStack Cognito User Pool + Client.

## Data
DynamoDB item: PK=`USER#<id>`, SK=`PROJECT#<id>`, status, originalImageKey, timestamps, GSIs for status/date.

## Contracts
`UploadRequest` / `UploadResponse` in `shared/contracts/json/rest-api.json`.

## Sequence
1. POST /upload → presigned URL + projectId.
2. Browser PUT to S3.
3. POST /upload/complete → status `analyzing`, SQS message.
4. S3 event → EventBridge → pipeline.
