# Requirements — Room Upload & Authentication

## Introduction
Authenticated users upload a room photo that is stored in S3 and triggers the analysis pipeline.

## Requirements

### Requirement 1: Authentication
**User Story:** As a user, I want to sign up and log in, so that my projects are private.
#### Acceptance Criteria
1. WHEN a user submits email + password THEN the system SHALL register them via Amazon Cognito.
2. WHEN a registered user logs in THEN the system SHALL issue JWT tokens.
3. IF a request lacks a valid token THEN the API SHALL respond 401.

### Requirement 2: Photo Upload
**User Story:** As a user, I want to upload a room photo, so that AI can analyze it.
#### Acceptance Criteria
1. WHEN a user selects a JPG/PNG/WebP ≤ 10MB THEN the system SHALL return a presigned S3 URL.
2. WHEN the browser uploads via the presigned URL THEN the image SHALL go directly to the uploads bucket (not through Lambda).
3. WHILE uploading THE UI SHALL display a progress bar.
4. WHEN upload completes THEN the UI SHALL show a preview.
5. IF the file type or size is invalid THEN the system SHALL reject it with a friendly message.

### Requirement 3: Pipeline Trigger
**User Story:** As a user, I want analysis to start automatically after upload.
#### Acceptance Criteria
1. WHEN an object is created in the uploads bucket THEN EventBridge SHALL start the Step Functions pipeline.
2. WHEN upload completes THEN the system SHALL create a DynamoDB project record with status `analyzing`.
