"""
Pipeline Stage: Scene Assembly
Builds the canonical scene descriptor JSON from all pipeline outputs
"""
import os
import json
import uuid
from datetime import datetime, timezone
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-pipeline-scene-assembly")
dynamodb = boto3.resource("dynamodb")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "seeley-projects")


def handler(event, context):
    """Assemble scene descriptor from pipeline results"""
    project_id = event.get("projectId", "unknown")
    recommendations = event.get("recommendations", {})
    assets = event.get("assets", [])

    logger.info("Scene assembly stage", extra={"project_id": project_id})

    # Build scene descriptor (canonical JSON per Q1 decision)
    now = datetime.now(timezone.utc).isoformat()
    recs = recommendations.get("recommendations", [])
    primary_rec = recs[0] if recs else {}

    scene_descriptor = {
        "projectId": project_id,
        "userId": "placeholder",
        "room": {
            "width": event.get("estimatedDimensions", {}).get("width", 5.0),
            "length": event.get("estimatedDimensions", {}).get("length", 4.0),
            "height": event.get("estimatedDimensions", {}).get("height", 2.8),
            "roomType": event.get("roomType", "living_room"),
        },
        "items": _build_furniture_items(primary_rec, assets),
        "theme": {
            "name": primary_rec.get("theme", "Modern"),
            "colorPalette": primary_rec.get("colorScheme", ["#f5f5f4", "#78716c"]),
            "materials": primary_rec.get("suggestedMaterials", []),
            "lighting": "warm",
        },
        "metadata": {
            "createdAt": now,
            "updatedAt": now,
            "version": 1,
            "status": "ready",
        },
    }

    # Persist to DynamoDB
    table = dynamodb.Table(PROJECTS_TABLE)
    table.update_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"},
        UpdateExpression="SET #d.sceneDescriptor = :scene, #d.#s = :status",
        ExpressionAttributeNames={"#d": "data", "#s": "status"},
        ExpressionAttributeValues={
            ":scene": scene_descriptor,
            ":status": "ready",
        },
    )

    logger.info("Scene assembled", extra={"project_id": project_id, "item_count": len(scene_descriptor["items"])})

    return {
        "projectId": project_id,
        "sceneDescriptor": scene_descriptor,
        "status": "success",
    }


def _build_furniture_items(recommendation: dict, assets: list) -> list:
    """Build furniture item list from recommendation + retrieved assets"""
    items = []
    furniture_list = recommendation.get("furnitureList", [])

    for i, furniture in enumerate(furniture_list[:10]):  # Max 10 items
        item_id = str(uuid.uuid4())[:8]
        # Spread items across the room
        x = (i % 3 - 1) * 1.5
        z = (i // 3 - 1) * 1.5

        # Check if we have a matching asset
        matching_asset = next(
            (a for a in assets if a.get("category") == furniture.get("category")),
            None,
        )

        items.append({
            "id": item_id,
            "name": furniture.get("name", f"Item {i+1}"),
            "category": furniture.get("category", "other"),
            "position": {"x": x, "y": 0, "z": z},
            "rotation": {"x": 0, "y": 0, "z": 0},
            "scale": {"x": 1, "y": 1, "z": 1},
            "modelUrl": matching_asset.get("glbUrl", "") if matching_asset else "",
            "dimensions": {"width": 1.0, "depth": 0.8, "height": 0.9},
            "isPlaceholder": matching_asset is None,
        })

    return items
