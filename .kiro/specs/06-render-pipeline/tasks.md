# Tasks — Photorealistic Render Pipeline

- [x] 1. `render.py` trigger endpoint + SQS enqueue + status update
- [x] 2. `BeforeAfterSlider` comparison component
- [x] 3. AiStack ControlNet + MiDaS + SDXL/FLUX SageMaker endpoints
- [x] 4. Render worker Lambda (SQS-triggered): two branches — ControlNet redesign + SDXL/FLUX theme preview (`lambda/render-worker/handler.py`)
- [x] 5. WebSocket `render_complete` (imageUrl + beforeUrl + themePreviewUrl) / `render_timeout` emission
- [x] 6. SQS render-jobs event source wired to render worker (ApiStack)
- [x] 7. Frontend render progress + slider wiring on `render_complete` (all 4 fields + fallback badge via `useProjectSocket` + `RenderResult`)
- [ ] 8. Timeout handling (>120s) + retry UI
- [ ] 9. Integration test: render job → 2 images in bucket → WS notify
- [ ] 10. Provision SDXL/FLUX model artifact (model.tar.gz) or confirm ControlNet fallback for FR-4.4
