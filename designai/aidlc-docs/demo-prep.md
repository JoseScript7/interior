# Demo Prep & Submission Checklist

## 3-Minute Demo Script
1. **0:00 Landing** — "DesignAI turns any room photo into a designed, purchasable interior in under 2 minutes."
2. **0:20 Upload** — drop living-room photo, show progress bar, preview.
3. **0:40 AI Analysis** — pipeline progress → 3 theme cards (Scandinavian / Industrial / Bohemian).
4. **1:00 3D Editor** — apply theme, drag sofa, rotate/scale, toggle 2D.
5. **1:30 AR** — phone → floor → sofa appears (wow moment).
6. **1:50 Render** — Generate Render → before/after slider.
7. **2:20 Shopping** — product cards, Amazon links, Add to Scene.
8. **2:45 Save & Share** — share link opens interactive design.

## Demo-ready gate (run this, not eyeballing)
The build is demo-ready the moment `scripts/smoke_test.py` passes end-to-end on one real image.

**One-command path** (chains preflight → staged deploy → seed → smoke, hard-stops with the reason on any failure):
```powershell
./deploy.ps1            # Windows
```
```bash
./deploy.sh             # Linux/macOS/CI    (SKIP_DEPLOY=1 ./deploy.sh to redeploy-skip)
```
Final line is unambiguous: `DEMO-READY: ...` or `BLOCKED at <step>: <reason>`.

**Manual path** (if you'd rather run stages yourself):
```bash
cd backend
python -m scripts.smoke_test --image ../seed/sample_room.jpg \
  --api-url  https://<rest-api-id>.execute-api.us-east-1.amazonaws.com/v1 \
  --ws-url   wss://<ws-api-id>.execute-api.us-east-1.amazonaws.com/v1 \
  --save-baseline baselines/run1.json
```
- Per-stage `[PASS]/[FAIL]/[SKIP]` maps 1:1 onto the Step Functions states — a failure points at which Lambda to open.
- Re-run after ANY prompt or model change; use `--compare-baseline baselines/run1.json` to catch silent output-quality drift.
- SDXL endpoint parked → stage reports `SKIPPED (endpoint not deployed) — fallback path verified`, which is NOT a failure.
- Save 3-5 known-good baselines before iterating further on prompts.

## Fallback safety net (capture before demo)
- [ ] Screenshot each pipeline stage (network-failure backup).
- [ ] Pre-recorded AR video (device/lighting risk).
- [ ] Tested sample room photo committed to repo.
- [ ] Timed dry-run < 3 min.
- [ ] Share-link flow verified end-to-end.

## Submission write-up artifacts
- [ ] Screenshots of each `requirements.md` (user stories + EARS).
- [ ] Screenshots of each `design.md` (architecture + sequence).
- [ ] Screenshot of hooks firing in terminal.
- [ ] Screenshot of Kiro credit dashboard.
- [ ] Paragraph: which steering files guided which decisions.
- [ ] Live demo link (Amplify frontend + Lambda backend).
- [ ] `.kiro/` directory committed (NOT gitignored).
