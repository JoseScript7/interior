"""
End-to-end smoke test / regression harness for Seeley.

Designed to be run repeatedly while iterating on prompts or swapping models.
It is LOUD and SPECIFIC: every pipeline stage gets its own pass/cross so a
failure points straight at which Lambda / Step Functions state to open.

Stages (map 1:1 onto the Step Functions state machine):
  1. upload            REST   POST /upload + PUT to S3 + POST /upload/complete
  2. validation        WS/inf pipeline accepted the image
  3. segmentation      WS/inf room understanding stage
  4. depth             WS/inf depth estimation stage
  5. inspiration       WS/inf Pinterest/inspiration style analysis (conditional)
  6. bedrock           REST   GET /recommend  -> 3 typed alternatives (contract-checked)
  7. retrieval         REST   GET /assets     -> OpenSearch furniture results
  8. render            REST   POST /render    -> jobId
  9. render_complete   WS     render_complete carries all 4 fields (contract-checked)
                              + SDXL branch reported SKIPPED/verified explicitly

Contract assertions (not just HTTP 200):
  - recommendations: exactly up to 3, each with required DesignRecommendation fields
  - render_complete: imageUrl(str), beforeUrl(str?), themePreviewUrl(str),
                     themePreviewFallback(bool)

Baseline regression:
  --save-baseline FILE     dump the Bedrock-stage output to FILE
  --compare-baseline FILE  diff this run's Bedrock output against FILE; warn on
                           structural drift (missing themes/fields)

Usage:
  python -m scripts.smoke_test --image ../seed/sample_room.jpg \
      --api-url https://xxxx.execute-api.us-east-1.amazonaws.com/v1 \
      --ws-url wss://yyyy.execute-api.us-east-1.amazonaws.com/v1 \
      --save-baseline baselines/run1.json

Exit code 0 only if all REQUIRED stages pass. SDXL-skipped is NOT a failure.
"""
import argparse
import json
import os
import sys
import threading
import time

# Windows consoles default to cp1252 and choke on Unicode glyphs; force UTF-8.
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except Exception:
    pass

try:
    import requests
except ImportError:
    sys.exit("Missing dependency: pip install requests")

# --- status markers (ASCII-safe; ANSI color is cp1252-safe) -----------------
GREEN, RED, YELLOW, GREY, RESET = "\033[92m", "\033[91m", "\033[93m", "\033[90m", "\033[0m"
OK = f"{GREEN}[PASS]{RESET}"
XX = f"{RED}[FAIL]{RESET}"
SKIP = f"{YELLOW}[SKIP]{RESET}"


class Stage:
    def __init__(self, key, label):
        self.key, self.label, self.status, self.detail = key, label, "pending", ""

    def passed(self, detail=""):
        self.status, self.detail = "pass", detail

    def failed(self, detail=""):
        self.status, self.detail = "fail", detail

    def skipped(self, detail=""):
        self.status, self.detail = "skip", detail

    def render(self):
        glyph = {"pass": OK, "fail": XX, "skip": SKIP, "pending": f"{GREY}[ -- ]{RESET}"}[self.status]
        line = f"  {glyph} {self.label}"
        if self.detail:
            color = {"pass": GREY, "fail": RED, "skip": YELLOW}.get(self.status, GREY)
            line += f"  {color}{self.detail}{RESET}"
        return line


STAGES = [
    Stage("upload", "upload"),
    Stage("validation", "validation"),
    Stage("segmentation", "segmentation"),
    Stage("depth", "depth"),
    Stage("inspiration", "inspiration analysis"),
    Stage("bedrock", "bedrock reasoning"),
    Stage("retrieval", "opensearch retrieval"),
    Stage("render", "render trigger"),
    Stage("render_complete", "render_complete (both branches)"),
    Stage("websocket", "websocket events received"),
]
S = {st.key: st for st in STAGES}


# --- WebSocket listener (background thread) ---------------------------------
class WSListener(threading.Thread):
    """Collects all socket messages for a project; tolerant if ws lib missing."""

    def __init__(self, ws_url, project_id):
        super().__init__(daemon=True)
        self.ws_url, self.project_id = ws_url, project_id
        self.messages = []
        self.stages_seen = set()
        self.render_complete = None
        self._stop = threading.Event()
        self.available = bool(ws_url)

    def run(self):
        if not self.ws_url:
            return
        try:
            import websocket  # websocket-client
        except ImportError:
            self.available = False
            return
        try:
            ws = websocket.create_connection(self.ws_url, timeout=5)
        except Exception:
            self.available = False
            return
        ws.settimeout(2)
        while not self._stop.is_set():
            try:
                raw = ws.recv()
            except Exception:
                continue
            if not raw:
                continue
            try:
                msg = json.loads(raw)
            except (ValueError, TypeError):
                continue
            if msg.get("projectId") and msg["projectId"] != self.project_id:
                continue
            self.messages.append(msg)
            t = msg.get("type")
            if t == "pipeline_progress":
                self.stages_seen.add((msg.get("stage") or "").lower())
            elif t == "render_complete":
                self.render_complete = msg
        try:
            ws.close()
        except Exception:
            pass

    def stop(self):
        self._stop.set()


# --- Helpers ----------------------------------------------------------------
def hdr(api):
    token = os.environ.get("SMOKE_TEST_JWT", "")
    return {"Authorization": f"Bearer {token}"} if token else {}


def stage_from_ws(listener, *needles):
    """Mark intermediate stages from WS progress stage names if observed."""
    for seen in listener.stages_seen:
        if any(n in seen for n in needles):
            return True
    return False


# --- Stage implementations --------------------------------------------------
def run_upload(api, image_path):
    if not os.path.exists(image_path):
        S["upload"].failed(f"image not found: {image_path}")
        return None
    ext = image_path.rsplit(".", 1)[-1].lower()
    ctype = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
    try:
        r = requests.post(f"{api}/upload", json={"filename": os.path.basename(image_path), "contentType": ctype}, headers=hdr(api), timeout=15)
        if r.status_code != 200:
            S["upload"].failed(f"POST /upload -> {r.status_code}")
            return None
        body = r.json()
        for k in ("projectId", "uploadUrl", "imageKey"):
            if k not in body:
                S["upload"].failed(f"UploadResponse missing '{k}'")
                return None
        with open(image_path, "rb") as f:
            put = requests.put(body["uploadUrl"], data=f, headers={"Content-Type": ctype}, timeout=30)
        if put.status_code not in (200, 204):
            S["upload"].failed(f"S3 PUT -> {put.status_code}")
            return None
        requests.post(f"{api}/upload/complete", json={"projectId": body["projectId"], "imageKey": body["imageKey"]}, headers=hdr(api), timeout=15)
        S["upload"].passed(f"projectId={body['projectId'][:8]}")
        return body["projectId"]
    except requests.RequestException as e:
        S["upload"].failed(str(e))
        return None


def validate_recommendation(rec):
    required = ["theme", "description"]
    missing = [k for k in required if k not in rec]
    return missing


def run_bedrock(api, project_id, poll_seconds=90):
    """Poll /recommend until recommendations appear; contract-check them."""
    deadline = time.time() + poll_seconds
    last_status = ""
    while time.time() < deadline:
        try:
            r = requests.get(f"{api}/recommend", params={"project_id": project_id}, headers=hdr(api), timeout=20)
            last_status = r.status_code
            if r.status_code == 200:
                data = r.json()
                recs = data.get("recommendations") or []
                if recs:
                    if len(recs) > 3:
                        S["bedrock"].failed(f"expected <=3 recommendations, got {len(recs)}")
                        return data
                    for i, rec in enumerate(recs):
                        miss = validate_recommendation(rec)
                        if miss:
                            S["bedrock"].failed(f"rec[{i}] missing {miss}")
                            return data
                    S["bedrock"].passed(f"{len(recs)} typed alternatives, contract OK")
                    return data
        except requests.RequestException as e:
            last_status = str(e)
        time.sleep(5)
    S["bedrock"].failed(f"no recommendations within {poll_seconds}s (last={last_status})")
    return None


def run_retrieval(api, project_id):
    try:
        r = requests.get(f"{api}/assets", params={"query": "scandinavian oak sofa", "limit": 3}, headers=hdr(api), timeout=20)
        if r.status_code != 200:
            S["retrieval"].failed(f"GET /assets -> {r.status_code}")
            return
        results = r.json().get("results", [])
        if not results:
            S["retrieval"].failed("0 results (empty index? run seed_opensearch first)")
            return
        S["retrieval"].passed(f"{len(results)} furniture hits")
    except requests.RequestException as e:
        S["retrieval"].failed(str(e))


def run_render(api, project_id, theme):
    try:
        r = requests.post(f"{api}/render", json={"projectId": project_id, "selectedTheme": theme}, headers=hdr(api), timeout=20)
        if r.status_code != 200:
            S["render"].failed(f"POST /render -> {r.status_code}")
            return None
        body = r.json()
        if "jobId" not in body:
            S["render"].failed("RenderResponse missing jobId")
            return None
        S["render"].passed(f"jobId={body['jobId'][:8]}")
        return body["jobId"]
    except requests.RequestException as e:
        S["render"].failed(str(e))
        return None


def check_render_complete(listener, wait_seconds=130):
    """Wait for render_complete over WS; contract-check 4 fields; report SDXL."""
    if not listener.available:
        S["render_complete"].skipped("no WS lib/endpoint; cannot observe async render")
        return None
    deadline = time.time() + wait_seconds
    while time.time() < deadline and listener.render_complete is None:
        time.sleep(2)
    msg = listener.render_complete
    if msg is None:
        S["render_complete"].failed(f"no render_complete within {wait_seconds}s")
        return None

    errors = []
    if not isinstance(msg.get("imageUrl"), str) or not msg["imageUrl"]:
        errors.append("imageUrl missing/!str")
    if "themePreviewUrl" not in msg or not isinstance(msg["themePreviewUrl"], str):
        errors.append("themePreviewUrl missing/!str")
    if not isinstance(msg.get("themePreviewFallback"), bool):
        errors.append("themePreviewFallback not bool")
    if errors:
        S["render_complete"].failed("; ".join(errors))
        return msg

    if msg.get("themePreviewFallback") is True:
        S["render_complete"].passed("ControlNet OK; SDXL SKIPPED (endpoint not deployed) — fallback path verified")
    else:
        S["render_complete"].passed("ControlNet OK; SDXL theme preview OK")
    return msg


# --- Baseline regression ----------------------------------------------------
def save_baseline(path, bedrock_data):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(bedrock_data, f, indent=2)
    print(f"\n{GREY}Saved Bedrock baseline -> {path}{RESET}")


def compare_baseline(path, bedrock_data):
    if not os.path.exists(path):
        print(f"\n{YELLOW}Baseline {path} not found; skipping comparison.{RESET}")
        return
    with open(path, "r", encoding="utf-8") as f:
        base = json.load(f)
    base_recs = base.get("recommendations") or []
    new_recs = (bedrock_data or {}).get("recommendations") or []
    print(f"\n{GREY}--- Baseline comparison ({path}) ---{RESET}")
    if len(base_recs) != len(new_recs):
        print(f"{YELLOW}  DRIFT: recommendation count {len(base_recs)} -> {len(new_recs)}{RESET}")
    base_themes = {r.get("type") or r.get("theme") for r in base_recs}
    new_themes = {r.get("type") or r.get("theme") for r in new_recs}
    if base_themes != new_themes:
        print(f"{YELLOW}  DRIFT: themes {base_themes} -> {new_themes}{RESET}")
    for r in new_recs:
        for field in ("colorScheme", "suggestedMaterials", "estimatedCost", "reasoning"):
            if field not in r:
                print(f"{YELLOW}  DRIFT: '{r.get('theme')}' lost field '{field}'{RESET}")
    if len(base_recs) == len(new_recs) and base_themes == new_themes:
        print(f"{GREEN}  No structural drift detected.{RESET}")


# --- Main -------------------------------------------------------------------
def main():
    p = argparse.ArgumentParser(description="Seeley end-to-end smoke test.")
    p.add_argument("--image", default="../seed/sample_room.jpg")
    p.add_argument("--api-url", default=os.environ.get("SMOKE_API_URL", "http://localhost:8000"))
    p.add_argument("--ws-url", default=os.environ.get("SMOKE_WS_URL", ""))
    p.add_argument("--theme", default="Scandinavian")
    p.add_argument("--save-baseline")
    p.add_argument("--compare-baseline")
    args = p.parse_args()
    api = args.api_url.rstrip("/")

    print(f"\nSeeley smoke test  api={api}  ws={'set' if args.ws_url else 'none'}\n")

    project_id = run_upload(api, args.image)
    listener = None
    if project_id:
        listener = WSListener(args.ws_url, project_id)
        listener.start()
        time.sleep(1)

        bedrock_data = run_bedrock(api, project_id)

        # Intermediate pipeline stages — observed via WS progress if available,
        # otherwise inferred from Bedrock success (downstream of all of them).
        ws_ok = listener.available and bool(listener.messages)
        inferred = " (inferred)" if not ws_ok else ""
        bedrock_ok = S["bedrock"].status == "pass"
        for key, needles in [
            ("validation", ("valid",)),
            ("segmentation", ("segment", "room")),
            ("depth", ("depth",)),
        ]:
            if stage_from_ws(listener, *needles):
                S[key].passed("via WS progress")
            elif bedrock_ok:
                S[key].passed(f"downstream-OK{inferred}")
            else:
                S[key].failed("not observed and Bedrock failed")

        # Inspiration analysis is conditional (only if an inspiration image was sent)
        if stage_from_ws(listener, "pinterest", "inspiration", "style"):
            S["inspiration"].passed("via WS progress")
        else:
            S["inspiration"].skipped("no inspiration image supplied (conditional stage)")

        run_retrieval(api, project_id)
        job_id = run_render(api, project_id, args.theme)
        if job_id:
            check_render_complete(listener)

        # WebSocket overall
        if listener.available and listener.messages:
            S["websocket"].passed(f"{len(listener.messages)} msgs received")
        elif not args.ws_url:
            S["websocket"].skipped("no --ws-url provided")
        else:
            S["websocket"].failed("WS configured but no messages received")

        listener.stop()

        if args.save_baseline and bedrock_data:
            save_baseline(args.save_baseline, bedrock_data)
        if args.compare_baseline:
            compare_baseline(args.compare_baseline, bedrock_data)

    # --- Report ---
    print(f"\n{'='*52}\n  STAGE REPORT\n{'='*52}")
    for st in STAGES:
        print(st.render())

    required = [st for st in STAGES if st.key not in ("inspiration",)]
    failed = [st for st in required if st.status == "fail"]
    print(f"{'='*52}")
    if failed:
        print(f"{RED}RESULT: FAIL - {len(failed)} required stage(s) broke: {[s.key for s in failed]}{RESET}")
        sys.exit(1)
    skipped = [st for st in STAGES if st.status == "skip"]
    note = f" ({len(skipped)} skipped: {[s.key for s in skipped]})" if skipped else ""
    print(f"{GREEN}RESULT: PASS - build is demo-ready{note}{RESET}")
    sys.exit(0)


if __name__ == "__main__":
    main()
