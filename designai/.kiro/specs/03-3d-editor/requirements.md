# Requirements — 3D Room Editor

## Introduction
An interactive Three.js editor where users place, transform, and customize furniture in their room.

## Requirements

### Requirement 1: Room Canvas
**User Story:** As a user, I want to view my room in 3D.
#### Acceptance Criteria
1. THE editor SHALL render room dimensions from the analysis.
2. THE user SHALL orbit (drag) and zoom (scroll) the camera.
3. THE editor SHALL provide a floor grid and a 2D/3D toggle.

### Requirement 2: Furniture Manipulation
**User Story:** As a user, I want to place and adjust furniture.
#### Acceptance Criteria
1. WHEN a catalog item is clicked THEN it SHALL be added to the room center.
2. WHEN an item is dragged THEN collision SHALL use bounding-box overlap; on release it SHALL snap to the nearest non-overlapping position.
3. WHILE an item overlaps another THE item SHALL show a red highlight.
4. WHEN an item is selected THEN the user SHALL change color, scale (0.5–2x), rotate (90°), and delete.

### Requirement 3: Persistence
**User Story:** As a user, I want to save my design.
#### Acceptance Criteria
1. WHEN the user saves THEN the scene descriptor SHALL be POSTed and stored in DynamoDB with an incremented version.
2. THE system SHALL support undo/redo (Cmd+Z / Cmd+Shift+Z).
