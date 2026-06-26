# GLB Asset Normalization (one-time batch, before demo)

Free GLB catalogs (Poly Haven, Sketchfab, KitBash3D) use inconsistent unit scales
(1 unit = 1cm vs 1m). Loaded together in Three.js, one item appears 100x larger.

## Procedure
1. Install glTF-Transform CLI: `npm i -g @gltf-transform/cli`
2. For each raw GLB:
   ```bash
   gltf-transform optimize raw/<item>.glb tmp/<item>.glb \
     --texture-compress webp --simplify false
   ```
3. Compute bounding box (Three.js `Box3.setFromObject` or gltf-transform inspect),
   then scale so the **longest dimension == real-world dimension** from product metadata:
   ```
   scaleFactor = realWorldLongestEdge_m / currentLongestEdge_units
   ```
4. Re-export normalized GLB to S3 `seeley-assets-{acct}/normalized/<item>.glb`.
5. Store `realWorldDimensions {width,depth,height}` in OpenSearch alongside the embedding
   (see `seed/products.json` `dimensions`, in cm).

## Why it matters
The 3D editor and AR mode both rely on `dimensions` to place furniture at correct scale.
Un-normalized assets break the metric-scale work in `metric_scale.py`.

## Status
- Procedure documented. Requires the actual GLB binaries (human/wall-clock download)
  and the glTF-Transform CLI run. Not executable purely from this repo.
