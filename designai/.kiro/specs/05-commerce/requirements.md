# Requirements — Furniture Matching & Commerce

## Introduction
Each recommendation surfaces matching real products via OpenSearch two-stage retrieval, with purchase links.

## Requirements

### Requirement 1: Furniture Matching
**User Story:** As a user, I want recommendations linked to real products.
#### Acceptance Criteria
1. WHEN a recommendation is generated THEN the system SHALL extract keyword phrases (type, material, color, style).
2. THE system SHALL embed phrases via Bedrock Titan and query OpenSearch.
3. THE retrieval SHALL be two-stage: vector k=20 candidates then keyword re-rank; return top 3 per query.

### Requirement 2: Product Cards
**User Story:** As a user, I want to view and act on matched products.
#### Acceptance Criteria
1. EACH product card SHALL show thumbnail, name, price.
2. THE card SHALL provide "View on Amazon" (external) and "Add to Scene" (loads GLB).
3. THE card SHALL provide "Find Similar" (re-runs search).

### Requirement 3: Data
#### Acceptance Criteria
1. THE catalog SHALL be seeded from `seed/products.json`.
2. `productUrl` SHALL link to an amazon.com search (no live PA-API for hackathon).
