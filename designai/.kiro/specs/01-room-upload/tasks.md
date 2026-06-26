# Tasks — Room Upload & Authentication

- [x] 1. AuthStack: Cognito User Pool + web client
- [x] 2. DataStack: uploads bucket (CORS, versioning) + projects table
- [x] 3. Backend `upload.py`: presigned URL endpoint + project record
- [x] 4. Backend `upload.py`: `/upload/complete` → SQS + status update
- [x] 5. Frontend upload page: dropzone + progress + preview
- [x] 6. EventBridge rule: uploads ObjectCreated → Step Functions
- [ ] 7. Wire Cognito JWT into frontend fetch calls (Amplify Auth)
- [ ] 8. Unit tests: validation (type/size), presigned URL generation
- [ ] 9. Integration test: upload → record created → pipeline started
