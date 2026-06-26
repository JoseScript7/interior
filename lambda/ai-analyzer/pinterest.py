"""
Pipeline Stage: Pinterest Inspiration Analysis
Uses Bedrock Claude for vision-language understanding of inspiration images
"""
import os
import json
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-pipeline-pinterest")
bedrock_client = boto3.client("bedrock-runtime")
s3_client = boto3.client("s3")

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET", "seeley-uploads")

PINTEREST_SYSTEM_PROMPT = """You are an expert interior design analyst. Analyze this inspiration image and extract structured design attributes. Return ONLY JSON:

{
  "style": "<primary design style>",
  "subStyles": ["<secondary styles>"],
  "wood": "<dominant wood type or 'none'>",
  "floor": "<floor type and color>",
  "wall": "<wall treatment and color>",
  "lighting": "<lighting mood>",
  "plants": <boolean>,
  "minimalism": <0.0 to 1.0>,
  "warmth": <0.0 to 1.0>,
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "materials": ["<material1>", "<material2>"],
  "furnitureTypes": ["<type1>", "<type2>"],
  "decorativeElements": ["<element1>", "<element2>"]
}"""


def handler(event, context):
    """Analyze Pinterest/inspiration images for style extraction"""
    project_id = event.get("projectId", "unknown")
    image_key = event.get("inspirationImageKey") or event.get("imageKey", "")

    logger.info("Pinterest analysis stage", extra={"project_id": project_id})

    if not image_key:
        # No inspiration image — return neutral style profile
        return {
            "projectId": project_id,
            "pinterestAnalysis": {
                "style": "modern",
                "minimalism": 0.5,
                "warmth": 0.5,
                "colorPalette": ["#f5f5f4", "#78716c", "#d6d3d1", "#a8a29e", "#e7e5e4"],
            },
            "status": "skipped",
        }

    try:
        # Get image from S3
        s3_response = s3_client.get_object(Bucket=UPLOADS_BUCKET, Key=image_key)
        image_bytes = s3_response["Body"].read()

        ext = image_key.split(".")[-1].lower()
        if ext == "jpg":
            ext = "jpeg"

        # Call Bedrock
        response = bedrock_client.converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{"text": PINTEREST_SYSTEM_PROMPT}],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"image": {"format": ext, "source": {"bytes": image_bytes}}},
                        {"text": "Analyze this interior design inspiration image. Return only JSON."},
                    ],
                }
            ],
            inferenceConfig={"maxTokens": 1024, "temperature": 0.3},
        )

        output_text = response["output"]["message"]["content"][0]["text"]
        if "```json" in output_text:
            output_text = output_text.split("```json")[1].split("```")[0].strip()
        elif "```" in output_text:
            output_text = output_text.split("```")[1].split("```")[0].strip()

        analysis = json.loads(output_text)

        logger.info("Pinterest analysis complete", extra={"style": analysis.get("style")})
        return {
            "projectId": project_id,
            "pinterestAnalysis": analysis,
            "status": "success",
        }

    except Exception as e:
        logger.error(f"Pinterest analysis failed: {e}")
        return {
            "projectId": project_id,
            "pinterestAnalysis": {"style": "modern", "minimalism": 0.5},
            "error": str(e),
            "status": "fallback",
        }
