# Open Source Repository Integrations

> NOTE: blueprint3d was removed from scope. The editor uses React Three Fiber
> directly (`components/editor3d/RoomEditor.tsx`); nothing downstream referenced
> blueprint3d, so it was dead weight.

## VAST-AI-Research/TripoSR  (3D from product image)
GitHub: https://github.com/VAST-AI-Research/TripoSR
Deployment: SageMaker endpoint (see infrastructure/stacks/ai.ts)
Purpose: convert Amazon product images into glTF 3D models
Input: single product image (JPG/PNG) via S3 URL
Output: GLB file uploaded to designai-assets-{accountId} bucket

## lllyasviel/ControlNet  (structure-preserving redesign)
GitHub: https://github.com/lllyasviel/ControlNet
Deployment: SageMaker endpoint (MLSD + depth conditioning)
Purpose: reskin room while preserving walls, windows, floor structure
Input: room image + depth map (from MiDaS) + style prompt
Output: redesigned room image uploaded to designai-renders bucket

## isl-org/MiDaS  (depth estimation)
GitHub: https://github.com/isl-org/MiDaS
Deployment: SageMaker endpoint (DPT-Large model)
Purpose: generate depth map from room photo → feeds ControlNet
