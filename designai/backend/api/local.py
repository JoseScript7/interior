"""
Path C — LOCAL_MODE backend.

Real AI with zero dependency on the (blocked) CDK deploy:
  - takes the uploaded room photo directly (multipart, base64 to Bedrock)
  - calls Amazon Bedrock (Claude Sonnet 4.6 via inference profile) for real
    room analysis + 3 design recommendations
  - persists projects to the local filesystem (.data/) instead of DynamoDB

Runs anywhere with valid AWS creds + Bedrock access (localhost, EC2, etc.).
"""
import os
import json
import uuid
import base64
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from aws_lambda_powertools import Logger

logger = Logger(child=True)
router = APIRouter()

REGION = os.environ.get("AWS_REGION_NAME", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")

bedrock = boto3.client("bedrock-runtime", region_name=REGION)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".data")
os.makedirs(DATA_DIR, exist_ok=True)

SYSTEM_PROMPT = """You are a certified interior architect with 20 years of experience.
Analyze the provided room image and return ONLY valid JSON (no markdown, no prose) with this exact shape:
{
  "roomType": "living_room|bedroom|kitchen|bathroom|office|dining_room|other",
  "estimatedDimensions": { "width": <m>, "length": <m>, "height": <m> },
  "currentStyle": "<style>",
  "lightingQuality": "excellent|good|adequate|poor",
  "detectedObjects": ["..."],
  "colorPalette": ["#hex","#hex","#hex","#hex","#hex"],
  "designRecommendations": [
    { "theme":"<name>", "type":"closest_to_inspiration", "description":"<2-3 sentences>",
      "colorScheme":["#hex","#hex","#hex"], "suggestedMaterials":["..."],
      "estimatedCost":<usd>, "reasoning":"<why>" },
    { "theme":"<name>", "type":"budget_optimized", "description":"...",
      "colorScheme":["#hex","#hex","#hex"], "suggestedMaterials":["..."],
      "estimatedCost":<usd>, "reasoning":"..." },
    { "theme":"<name>", "type":"creative_reinterpretation", "description":"...",
      "colorScheme":["#hex","#hex","#hex"], "suggestedMaterials":["..."],
      "estimatedCost":<usd>, "reasoning":"..." }
  ]
}
Safety: never block exits/pathways, never recommend impossible placements."""


def _store_path(project_id: str) -> str:
    safe = "".join(c for c in project_id if c.isalnum() or c in "-_")
    return os.path.join(DATA_DIR, f"{safe}.json")


def _save(project_id: str, data: dict) -> None:
    with open(_store_path(project_id), "w", encoding="utf-8") as f:
        json.dump(data, f)


def _load(project_id: str) -> dict | None:
    p = _store_path(project_id)
    if not os.path.exists(p):
        return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def _bedrock_analyze(image_bytes: bytes, image_format: str) -> dict:
    fmt = "jpeg" if image_format in ("jpg", "jpeg") else image_format
    resp = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[{
            "role": "user",
            "content": [
                {"image": {"format": fmt, "source": {"bytes": image_bytes}}},
                {"text": "Analyze this room. Return only the JSON object."},
            ],
        }],
        inferenceConfig={"maxTokens": 4096, "temperature": 0.8},
    )
    text = resp["output"]["message"]["content"][0]["text"]
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    return json.loads(text.strip())


@router.post("/analyze")
async def analyze(image: UploadFile = File(...), roomType: str = Form(default="")):
    """Upload a room photo -> real Bedrock analysis + 3 recommendations."""
    content = await image.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10MB")
    ext = (image.filename or "room.jpg").rsplit(".", 1)[-1].lower()

    try:
        analysis = _bedrock_analyze(content, ext)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned an unparseable response — try again")
    except Exception as e:  # noqa: BLE001
        logger.exception("Bedrock analyze failed")
        raise HTTPException(status_code=502, detail=f"Bedrock error: {str(e)[:200]}")

    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "projectId": project_id,
        "roomType": roomType or analysis.get("roomType"),
        "analysis": analysis,
        "recommendations": analysis.get("designRecommendations", []),
        "imageBase64": "data:image/" + ("jpeg" if ext in ("jpg", "jpeg") else ext) + ";base64," + base64.b64encode(content).decode(),
        "createdAt": now,
        "status": "recommendations_ready",
    }
    _save(project_id, record)
    logger.info("Local analyze complete", extra={"project_id": project_id})
    return {
        "projectId": project_id,
        "analysis": analysis,
        "recommendations": record["recommendations"],
    }


@router.get("/recommend")
def recommend(project_id: str):
    rec = _load(project_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"analysis": rec.get("analysis"), "recommendations": rec.get("recommendations", [])}


@router.get("/project/{project_id}")
def get_project(project_id: str):
    rec = _load(project_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Project not found")
    return rec


@router.post("/scene")
async def save_scene(payload: dict):
    project_id = payload.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id required")
    rec = _load(project_id) or {"projectId": project_id}
    rec["sceneDescriptor"] = payload.get("scene_descriptor")
    rec["status"] = "editing"
    _save(project_id, rec)
    return {"message": "saved", "project_id": project_id}


# ---------------------------------------------------------------------------
# Text -> 3D generation (AI bot in the suggestions tab)
# Bedrock parses the natural-language spec into a structured furniture object.
# HUNYUAN3D_ENDPOINT (a GPU SageMaker endpoint) is the drop-in for a real GLB;
# until that exists we return a structured spec the client renders procedurally.
# ---------------------------------------------------------------------------
HUNYUAN3D_ENDPOINT = os.environ.get("HUNYUAN3D_ENDPOINT", "")

GEN_SYSTEM_PROMPT = """You convert a natural-language furniture/object request into a strict JSON spec.
Return ONLY JSON (no markdown):
{
  "name": "<concise product name>",
  "category": "sofa|chair|table|bed|storage|lighting|rug|decor",
  "style": "<style>",
  "material": "<materials>",
  "color": "#hex (dominant colour)",
  "dimensions": { "width": <cm>, "depth": <cm>, "height": <cm> },
  "description": "<one sentence>",
  "estimatedPrice": <usd number>
}
Pick the closest category. Infer sensible real-world dimensions in centimetres."""


def _sagemaker_hunyuan3d(prompt: str) -> str | None:
    """Real text/image->3D via Hunyuan3D GPU endpoint, when available. Returns a GLB URL or None."""
    if not HUNYUAN3D_ENDPOINT:
        return None
    try:
        sm = boto3.client("sagemaker-runtime", region_name=REGION)
        resp = sm.invoke_endpoint(
            EndpointName=HUNYUAN3D_ENDPOINT,
            ContentType="application/json",
            Body=json.dumps({"prompt": prompt}),
        )
        out = json.loads(resp["Body"].read())
        return out.get("glbUrl")
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Hunyuan3D endpoint failed: {e}")
        return None


@router.post("/generate3d")
async def generate3d(payload: dict):
    """Natural-language spec -> structured 3D furniture object (added to catalog/scene)."""
    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt required")

    # 1) Bedrock structures the request
    try:
        resp = bedrock.converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{"text": GEN_SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 600, "temperature": 0.5},
        )
        text = resp["output"]["message"]["content"][0]["text"]
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        spec = json.loads(text.strip())
    except Exception as e:  # noqa: BLE001
        logger.exception("generate3d Bedrock failed")
        raise HTTPException(status_code=502, detail=f"AI spec generation failed: {str(e)[:160]}")

    # 2) Real GLB via Hunyuan3D GPU endpoint if configured; else procedural placeholder
    glb_url = _sagemaker_hunyuan3d(prompt)

    item = {
        "productId": "gen-" + uuid.uuid4().hex[:8],
        "name": spec.get("name", "Generated Object"),
        "category": spec.get("category", "decor"),
        "style": spec.get("style", "custom"),
        "material": spec.get("material", ""),
        "color": spec.get("color", "#9aa0a6"),
        "price": spec.get("estimatedPrice", 0),
        "dimensions": spec.get("dimensions", {"width": 40, "depth": 40, "height": 40}),
        "description": spec.get("description", ""),
        "glbUrl": glb_url,                 # null until GPU endpoint exists
        "generatedByHunyuan3D": bool(glb_url),
        "source": "hunyuan3d" if glb_url else "procedural-placeholder",
    }
    logger.info("generate3d", extra={"category": item["category"], "source": item["source"]})
    return {"item": item}

