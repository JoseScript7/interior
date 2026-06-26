# Requirements — Photorealistic Render Pipeline

## Introduction
Users generate a photorealistic redesign of their room preserving its geometry.

## Requirements

### Requirement 1: Render Trigger
**User Story:** As a user, I want to generate a photorealistic render.
#### Acceptance Criteria
1. WHEN the user clicks Generate Render THEN the system SHALL POST {projectId, selectedTheme, sceneJson} and return a jobId.
2. THE system SHALL enqueue an SQS render job.

### Requirement 2: Render Execution (two distinct outputs)
#### Acceptance Criteria
1. THE render Lambda SHALL fetch the original image, call MiDaS for depth, then ControlNet with the theme prompt to produce a **geometry-preserving redesign** of the photographed room.
2. THE render Lambda SHALL ALSO produce a **standalone alternate-theme preview** (FR-4.4) via SDXL/FLUX.1, which does NOT preserve the literal photographed room geometry.
3. BOTH outputs SHALL be uploaded to the renders bucket under distinct keys.
4. WHEN complete THEN the system SHALL send WebSocket `render_complete` with imageUrl (ControlNet) + beforeUrl + themePreviewUrl (SDXL/FLUX).

### Requirement 2.4 (FR-4.4): Alternate Décor Theme Generation
**User Story:** As a user, I want standalone alternate-theme preview images, so I can compare bolder reinterpretations that need not match my room's exact geometry.
#### Acceptance Criteria
1. THE system SHALL generate alternate-theme previews via SDXL/FLUX.1 (distinct code path from the ControlNet geometry-preserving render).
2. IF the SDXL/FLUX.1 endpoint is unavailable in this build THEN the system SHALL fall back to ControlNet with the same input/output contract, AND this substitution SHALL be documented for judges (swappable post-hackathon).

### Requirement 3: UX & Timeout
#### Acceptance Criteria
1. WHILE rendering THE UI SHALL show progress (~45s).
2. WHEN complete THE UI SHALL show a before/after comparison slider.
3. IF render exceeds 120s THEN the system SHALL send `render_timeout` and the UI SHALL offer retry.
