"""
Pipeline Stage: Persist
Final persistence of completed pipeline results
"""
import os
from datetime import datetime, timezone
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-pipeline-persist")
dynamodb = boto3.resource("dynamodb")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "seeley-projects")


def handler(event, context):
    """Persist final pipeline state"""
    project_id = event.get("projectId", "unknown")
    now = datetime.now(timezone.utc).isoformat()

    logger.info("Persist stage", extra={"project_id": project_id})

    table = dynamodb.Table(PROJECTS_TABLE)
    table.update_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"},
        UpdateExpression="SET #d.#s = :status, #d.updatedAt = :now, GSI1PK = :gsi1pk, GSI1SK = :now",
        ExpressionAttributeNames={"#d": "data", "#s": "status"},
        ExpressionAttributeValues={
            ":status": "ready",
            ":now": now,
            ":gsi1pk": "STATUS#ready",
        },
    )

    return {
        "projectId": project_id,
        "status": "success",
        "completedAt": now,
    }
