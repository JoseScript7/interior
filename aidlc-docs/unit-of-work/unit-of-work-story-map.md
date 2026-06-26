# Unit of Work — Story Map (FR → Unit)

| FR | Functional Requirement | Unit |
|----|------------------------|------|
| FR1 | Authenticate users securely (Cognito) | U1, U4 |
| FR2 | Accept room photographs (upload + S3) | U4, U6 |
| FR3 | Accept inspiration images | U3, U6 |
| FR4 | Understand room geometry (segmentation + depth) | U2 |
| FR5 | Extract style characteristics (Pinterest/Qwen) | U3 |
| FR6 | Recommend layouts/materials/colors (Bedrock, 3 alts) | U3 |
| FR7 | OpenSearch vector furniture search (two-stage) | U5 |
| FR8 | Generate or retrieve editable 3D furniture | U3, U5 |
| FR9 | Async 3D model swap-in via WebSocket | U3, U4, U6 |
| FR10 | Drag-and-drop editing (bounding-box collision) | U6 |
| FR11 | Render realistic previews (ControlNet/MiDaS) | U3, U4 |
| FR12 | 2D redesign preview (SDXL/FLUX) | U3 |
| FR13 | WebSocket progress updates | U4, U6 |
| FR14 | Redis caching (session/recommendation) | U1, U4 |
| FR15 | AI guardrails (no blocked exits/impossible placement) | U3 |
| FR16 | Save and share projects | U4, U6 |
