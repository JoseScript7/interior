"""
Analyze API — Bedrock AI room analysis + recommendations
Single Bedrock call with temperature=0.8, returns 3 alternatives (Q2 decision)
"""
import os
import json
import base64
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from aws_lambda_powertools import Logger

logger = Logger(child=True)
router = APIRouter()

bedrock_client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))
s3_client = boto3.client("s3", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))
dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET", "seeley-uploads")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "seeley-projects")

SYSTEM_PROMPT = """You are an expert certified interior architect and designer. Analyze the provided room image and return a JSON response.

You must return ONLY valid JSON with this exact structure:
{
  "roomType": "living_room|bedroom|kitchen|bathroom|office|dining_room|other",
  "estimatedDimensions": { "width": <meters>, "length": <meters>, "height": <meters> },
  "currentStyle": "<detected style>",
  "lightingQuality": "excellent|good|adequate|poor",
  "detectedObjects": ["<object1>", "<object2>", ...],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "designRecommendations": [
    {
      "theme": "<theme name>",
      "type": "closest_to_current|budget_optimized|creative_reinterpretation",
      "description": "<2-3 sentences>",
      "colorScheme": ["#hex1", "#hex2", "#hex3"],
      "suggestedMaterials": ["material1", "material2"],
      "estimatedCost": <USD number>,
      "reasoning": "<why this works for the space>"
    }
  ]
}

Generate exactly 3 recommendations:
1. "closest_to_current" — enhances existing style
2. "budget_optimized" — reduces cost by 30%
3. "creative_reinterpretation" — bold creative alternative

Prioritize functionality, safety, accessibility. Never block exits or pathways."""


@router.get("/")
def get_recommendations(project_id: str):
    """Get AI recommendations for a project"""
    table = dynamodb.Table(PROJECTS_TABLE)
    response = table.get_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"}
    )
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Project not found")

    project_data = item.get("data", {})
    recommendations = project_data.get("recommendations")

    if recommendations:
        return {"recommendations": recommendations, "analysis": project_data.get("analysis")}

    # If no recommendations yet, trigger analysis
    image_key = project_data.get("originalImageKey")
    if not image_key:
        raise HTTPException(status_code=400, detail="No image uploaded for this project")

    analysis = _run_bedrock_analysis(image_key)

    # Store results
    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"},
        UpdateExpression="SET #d.analysis = :analysis, #d.recommendations = :recs, #d.#s = :status, #d.updatedAt = :now, GSI1PK = :gsi1pk, GSI1SK = :now",
        ExpressionAttributeNames={"#d": "data", "#s": "status"},
        ExpressionAttributeValues={
            ":analysis": analysis,
            ":recs": analysis.get("designRecommendations", []),
            ":status": "recommendations_ready",
            ":now": now,
            ":gsi1pk": "STATUS#recommendations_ready",
        },
    )

    return {"recommendations": analysis.get("designRecommendations", []), "analysis": analysis}


def _run_bedrock_analysis(image_key: str) -> dict:
    """Call Bedrock with room image for analysis"""
    # Get image from S3
    s3_response = s3_client.get_object(Bucket=UPLOADS_BUCKET, Key=image_key)
    image_bytes = s3_response["Body"].read()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    # Determine media type
    ext = image_key.split(".")[-1].lower()
    media_type = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")

    # Call Bedrock using Converse API
    response = bedrock_client.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "image": {
                            "format": ext if ext != "jpg" else "jpeg",
                            "source": {"bytes": image_bytes},
                        }
                    },
                    {
                        "text": "Analyze this room and provide design recommendations. Return only valid JSON."
                    },
                ],
            }
        ],
        inferenceConfig={
            "maxTokens": 4096,
            "temperature": 0.8,
        },
    )

    # Parse response
    output_text = response["output"]["message"]["content"][0]["text"]

    # Extract JSON from response (handle markdown code blocks)
    if "```json" in output_text:
        output_text = output_text.split("```json")[1].split("```")[0].strip()
    elif "```" in output_text:
        output_text = output_text.split("```")[1].split("```")[0].strip()

    try:
        analysis = json.loads(output_text)
    except json.JSONDecodeError:
        logger.error("Failed to parse Bedrock response", extra={"raw": output_text[:500]})
        raise HTTPException(status_code=500, detail="AI analysis failed — invalid response format")

    return analysis
