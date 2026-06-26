# Requirements — AR Furniture Preview

## Introduction
Users preview furniture in their real room via AR on mobile, WebXR on desktop, with a graceful fallback.

## Requirements

### Requirement 1: Mobile AR
**User Story:** As a mobile user, I want to see furniture in my real room.
#### Acceptance Criteria
1. WHEN a mobile user opens AR THEN the system SHALL use `<model-viewer>` with `ar-modes="webxr scene-viewer quick-look"`.
2. THE model SHALL load from the CloudFront GLB URL.

### Requirement 2: Desktop WebXR
**User Story:** As a desktop user with WebXR, I want immersive AR.
#### Acceptance Criteria
1. IF `immersive-ar` is supported THEN the system SHALL offer an Enter AR button.

### Requirement 3: Fallback
**User Story:** As any user, I want a usable experience if AR is unsupported.
#### Acceptance Criteria
1. IF WebXR is unsupported THEN the system SHALL show a 360° spin view and an explanatory message.
2. THE component SHALL read URLs from environment variables (no hardcoded S3/CloudFront URLs).
