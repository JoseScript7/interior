"""
Scene API — Save/load scene descriptor (Zustand store ↔ DynamoDB)
Single canonical scene JSON (Q1 decision)
"""
import os
import json
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from aws_lambda_powertools import Logger

logger = Logger(child=True)
router = APIRouter()

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "designai-projects")


class SaveSceneRequest(BaseModel):
    project_id: str
    scene_descriptor: dict


@router.post("/")
def save_scene(request: SaveSceneRequest):
    """Save scene descriptor to DynamoDB"""
    table = dynamodb.Table(PROJECTS_TABLE)
    now = datetime.now(timezone.utc).isoformat()

    # Increment version
    scene = request.scene_descriptor
    metadata = scene.get("metadata", {})
    metadata["updatedAt"] = now
    metadata["version"] = metadata.get("version", 0) + 1
    scene["metadata"] = metadata

    table.update_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{request.project_id}"},
        UpdateExpression="SET #d.sceneDescriptor = :scene, #d.#s = :status, #d.updatedAt = :now",
        ExpressionAttributeNames={"#d": "data", "#s": "status"},
        ExpressionAttributeValues={
            ":scene": scene,
            ":status": "editing",
            ":now": now,
        },
    )

    logger.info("Scene saved", extra={"project_id": request.project_id, "version": metadata["version"]})
    return {"message": "Scene saved", "version": metadata["version"]}


@router.get("/")
def load_scene(project_id: str):
    """Load scene descriptor from DynamoDB"""
    table = dynamodb.Table(PROJECTS_TABLE)
    response = table.get_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"}
    )
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Project not found")

    project_data = item.get("data", {})
    scene = project_data.get("sceneDescriptor")

    if not scene:
        raise HTTPException(status_code=404, detail="No scene data for this project")

    return {"scene_descriptor": scene}
