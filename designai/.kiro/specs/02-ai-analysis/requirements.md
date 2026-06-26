# Requirements — AI Room Analysis

## Introduction
On upload, the system analyzes the room with Bedrock and returns 3 design recommendations.

## Requirements

### Requirement 1: Room Analysis
**User Story:** As a user, I want the AI to understand my room, so recommendations fit my space.
#### Acceptance Criteria
1. WHEN the pipeline receives an image THEN the system SHALL call Bedrock (Claude, multimodal) for analysis.
2. THE analysis SHALL include roomType, estimatedDimensions, currentStyle, lightingQuality, detectedObjects, colorPalette.
3. IF Bedrock returns invalid JSON THEN the system SHALL retry once with a guardrail prompt.

### Requirement 2: Three Recommendations
**User Story:** As a user, I want multiple design options.
#### Acceptance Criteria
1. WHEN analysis runs THEN the system SHALL return exactly 3 recommendations in a single Bedrock call (temperature 0.8).
2. THE three SHALL be typed: closest_to_inspiration, budget_optimized, creative_reinterpretation.
3. EACH SHALL include theme, description, colorScheme, suggestedMaterials, estimatedCost, reasoning.

### Requirement 3: Real-time UI
**User Story:** As a user, I want to see progress and results without refreshing.
#### Acceptance Criteria
1. WHILE analysis runs THE UI SHALL show a loading/progress state.
2. WHEN results are ready THEN the system SHALL push them via WebSocket.
3. WHEN Bedrock fails twice THEN the UI SHALL show a friendly retry option.
