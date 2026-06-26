"""
WebSocket Lambda handlers — connect/disconnect/notify
Used for real-time render progress and 3D model swap notifications (Q5 decision)
"""
import os
import json
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-ws")
dynamodb = boto3.resource("dynamodb")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "seeley-projects")


def connect(event, context):
    """Handle WebSocket $connect"""
    connection_id = event["requestContext"]["connectionId"]
    # Store connection in DynamoDB for broadcasting
    table = dynamodb.Table(PROJECTS_TABLE)
    table.put_item(
        Item={
            "PK": f"WS#{connection_id}",
            "SK": "CONNECTION",
            "connectionId": connection_id,
            "connectedAt": event["requestContext"].get("connectedAt", ""),
        }
    )
    logger.info("WebSocket connected", extra={"connection_id": connection_id})
    return {"statusCode": 200, "body": "Connected"}


def disconnect(event, context):
    """Handle WebSocket $disconnect"""
    connection_id = event["requestContext"]["connectionId"]
    table = dynamodb.Table(PROJECTS_TABLE)
    table.delete_item(
        Key={"PK": f"WS#{connection_id}", "SK": "CONNECTION"}
    )
    logger.info("WebSocket disconnected", extra={"connection_id": connection_id})
    return {"statusCode": 200, "body": "Disconnected"}


def send_to_client(endpoint_url: str, connection_id: str, message: dict):
    """Send message to a WebSocket client"""
    api_client = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint_url)
    try:
        api_client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(message).encode("utf-8"),
        )
    except api_client.exceptions.GoneException:
        logger.warning("Connection gone", extra={"connection_id": connection_id})
        # Clean up stale connection
        table = dynamodb.Table(PROJECTS_TABLE)
        table.delete_item(Key={"PK": f"WS#{connection_id}", "SK": "CONNECTION"})
