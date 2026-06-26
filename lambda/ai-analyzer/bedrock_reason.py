"""
Pipeline Stage: Bedrock Reasoning
Generates 3 design alternatives in single call (Q2 decision: temperature=0.8)
"""
import os
import json
import base64
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-pipeline-bedrock")
bedrock_client = boto3.client("bedrock-runtime")
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET", "seeley-uploads")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "seeley-projects")

DESIGN_SYSTEM_PROMPT = """You are an expert interior architect generating design recommendations.

Given room analysis data (dimensions, objects, style), generate 3 design alternatives as JSON:

{
  "recommendations": [
    {
      "theme": "<name>",
      "type": "closest_to_inspiration",
      "description": "<2-3 sentences>",
      "colorScheme": ["#hex1", "#hex2", "#hex3"],
      "suggestedMaterials": ["material1", "material2", "material3"],
      "furnitureList": [
        {"name": "<item>", "category": "<category>", "searchQuery": "<optimized search term>"}
      ],
      "estimatedCost": <USD>,
      "reasoning": "<why this works>"
    },
    {
      "theme": "<name>",
      "type": "budget_optimized",
      ...
    },
    {
      "theme": "<name>",
      "type": "creative_reinterpretation",
      ...
    }
  ],
  "layoutSuggestion": {
    "primaryArrangement": "<description>",
    "focalPoint": "<what draws the eye>",
    "trafficFlow": "<movement pattern>"
  }
}

Return ONLY valid JSON. No markdown, no explanations outside JSON."""


def handler(event, context):
    """Generate design recommendations using Bedrock"""
    logger.info("Bedrock reasoning stage", extra={"event_keys": list(event.keys())})

    project_id = event.get("projectId", "unknown")
    vision_results = event.get("visionResults", [{}])
    pinterest_analysis = event.get("pinterestAnalysis", {})

    # Build context from previous pipeline stages
    room_context = {
        "segmentation": vision_results[0] if len(vision_results) > 0 else {},
        "depth": vision_results[1] if len(vision_results) > 1 else {},
        "pinterestStyle": pinterest_analysis,
    }

    try:
        response = bedrock_client.converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{"text": DESIGN_SYSTEM_PROMPT}],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": f"Room analysis context:\n{json.dumps(room_context, indent=2)}\n\nGenerate 3 design alternatives. Return only JSON."
                        }
                    ],
                }
            ],
            inferenceConfig={"maxTokens": 4096, "temperature": 0.8},
        )

        output_text = response["output"]["message"]["content"][0]["text"]

        # Parse JSON from response
        if "```json" in output_text:
            output_text = output_text.split("```json")[1].split("```")[0].strip()
        elif "```" in output_text:
            output_text = output_text.split("```")[1].split("```")[0].strip()

        recommendations = json.loads(output_text)

        # Persist to DynamoDB
        table = dynamodb.Table(PROJECTS_TABLE)
        table.update_item(
            Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"},
            UpdateExpression="SET #d.recommendations = :recs, #d.#s = :status",
            ExpressionAttributeNames={"#d": "data", "#s": "status"},
            ExpressionAttributeValues={
                ":recs": recommendations.get("recommendations", []),
                ":status": "recommendations_ready",
            },
        )

        logger.info("Bedrock reasoning complete", extra={"project_id": project_id})

        return {
            "projectId": project_id,
            "recommendations": recommendations,
            "status": "success",
        }

    except Exception as e:
        logger.error(f"Bedrock reasoning failed: {e}")
        return {
            "projectId": project_id,
            "error": str(e),
            "status": "failed",
        }
