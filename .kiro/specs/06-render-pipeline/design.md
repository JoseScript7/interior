# Design — Photorealistic Render Pipeline

## Flow
```
POST /render ──► render-jobs SQS ──► render Lambda
   render Lambda: S3 image → MiDaS depth → ControlNet (steps 20, cfg 7) → S3 renders
                 → WebSocket render_complete {imageUrl, beforeUrl}
```

## Timeout
Lambda timeout 90s; if > 120s end-to-end → `render_timeout`. ControlNet on ml.g4dn.xlarge (autoscale min 0).

## Frontend
Render button (`EditorToolbar`) → progress → `BeforeAfterSlider` on `render_complete`.

## Contracts
`RenderRequest`, `RenderResponse` (`rest-api.json`); `render_complete` / `render_timeout` (`websocket/messages.json`).
