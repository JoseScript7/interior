# Design — AR Furniture Preview

## Component
`ARPreview` (`components/ar/ARPreview.tsx`), reusable `<ARPreview glbUrl={url} />`.

## Branching
- Mobile (UA detect) → `<model-viewer ar ar-modes="webxr scene-viewer quick-look">`.
- Desktop + `navigator.xr.isSessionSupported('immersive-ar')` → Enter AR (Three.js WebXR + hit testing).
- Else → 360° spin `<model-viewer auto-rotate>` + message.

## URLs
GLB URL passed in via props from CloudFront; base from `NEXT_PUBLIC_CLOUDFRONT_URL`. No hardcoded URLs.
