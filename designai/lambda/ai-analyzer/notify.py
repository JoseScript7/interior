"""
Pipeline Stage: Notify
Send WebSocket notification to frontend when pipeline completes
"""
import os
import json
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="designai-pipeline-notify")
dynamodb = boto3.resource("dynamodb")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "designai-projects")


def handler(event, context):
    """Notify connected WebSocket clients of pipeline completion"""
    project_id = event.get("projectId", "unknown")

    logger.info("Notify stage", extra={"project_id": project_id})

    # Get WebSocket endpoint from environment
    ws_endpoint = os.environ.get("WEBSOCKET_ENDPOINT", "")

    if not ws_endpoint:
        logger.warning("No WebSocket endpoint configured")
        return {"projectId": project_id, "status": "skipped", "reason": "no ws endpoint"}

    # Find all active connections
    table = dynamodb.Table(PROJECTS_TABLE)
    response = table.query(
        KeyConditionExpression="begins_with(PK, :ws)",
        ExpressionAttributeValues={":ws": "WS#"},
    )

    connections = response.get("Items", [])
    api_client = boto3.client("apigatewaymanagementapi", endpoint_url=ws_endpoint)

    message = json.dumps({
        "type": "pipeline_complete",
        "projectId": project_id,
        "status": "ready",
        "timestamp": event.get("completedAt", ""),
    })

    sent_count = 0
    for conn in connections:
        connection_id = conn.get("connectionId")
        if not connection_id:
            continue
        try:
            api_client.post_to_connection(
                ConnectionId=connection_id,
                Data=message.encode("utf-8"),
            )
            sent_count += 1
        except Exception as e:
            logger.warning(f"Failed to notify {connection_id}: {e}")
            # Clean up stale connection
            table.delete_item(Key={"PK": f"WS#{connection_id}", "SK": "CONNECTION"})

    logger.info("Notifications sent", extra={"sent_count": sent_count})

    return {
        "projectId": project_id,
        "notifiedConnections": sent_count,
        "status": "success",
    }
