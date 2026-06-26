"""
Upload API — S3 presigned URL generation + project creation
Direct browser-to-S3 upload (never route image through Lambda)
"""
import os
import uuid
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from aws_lambda_powertools import Logger

logger = Logger(child=True)

router = APIRouter()

s3_client = boto3.client("s3", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))
dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))
sqs_client = boto3.client("sqs", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))

UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET", "seeley-uploads")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "seeley-projects")
ANALYSIS_QUEUE_URL = os.environ.get("ANALYSIS_QUEUE_URL", "")


class UploadRequest(BaseModel):
    filename: str
    content_type: str
    room_type: str | None = None
    budget: float | None = None
    style: str | None = None


class UploadResponse(BaseModel):
    project_id: str
    upload_url: str
    image_key: str


@router.post("/", response_model=UploadResponse)
def get_presigned_upload_url(request: UploadRequest):
    """Generate presigned URL for direct S3 upload"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if request.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Use: {allowed_types}")

    # Generate project and image key
    project_id = str(uuid.uuid4())
    ext = request.filename.split(".")[-1] if "." in request.filename else "jpg"
    image_key = f"users/uploads/{project_id}/room.{ext}"

    # Generate presigned PUT URL (10 min expiry, 10MB max)
    presigned_url = s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": UPLOADS_BUCKET,
            "Key": image_key,
            "ContentType": request.content_type,
        },
        ExpiresIn=600,
    )

    # Create project record in DynamoDB
    now = datetime.now(timezone.utc).isoformat()
    table = dynamodb.Table(PROJECTS_TABLE)
    table.put_item(
        Item={
            "PK": f"USER#placeholder",  # Will be set from JWT in production
            "SK": f"PROJECT#{project_id}",
            "GSI1PK": "STATUS#created",
            "GSI1SK": now,
            "GSI2PK": "USER#placeholder",
            "GSI2SK": now,
            "data": {
                "projectId": project_id,
                "userId": "placeholder",
                "status": "created",
                "roomType": request.room_type,
                "budget": str(request.budget) if request.budget else None,
                "style": request.style,
                "originalImageKey": image_key,
                "createdAt": now,
                "updatedAt": now,
            },
        }
    )

    logger.info("Upload URL generated", extra={"project_id": project_id, "image_key": image_key})

    return UploadResponse(
        project_id=project_id,
        upload_url=presigned_url,
        image_key=image_key,
    )


class UploadCompleteRequest(BaseModel):
    project_id: str
    image_key: str


@router.post("/complete")
def upload_complete(request: UploadCompleteRequest):
    """Called after successful S3 upload to trigger analysis pipeline"""
    # Send message to analysis queue
    if ANALYSIS_QUEUE_URL:
        sqs_client.send_message(
            QueueUrl=ANALYSIS_QUEUE_URL,
            MessageBody=f'{{"projectId": "{request.project_id}", "imageKey": "{request.image_key}"}}',
        )

    # Update project status
    table = dynamodb.Table(PROJECTS_TABLE)
    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{request.project_id}"},
        UpdateExpression="SET #d.#s = :status, #d.updatedAt = :now, GSI1PK = :gsi1pk, GSI1SK = :now",
        ExpressionAttributeNames={"#d": "data", "#s": "status"},
        ExpressionAttributeValues={
            ":status": "analyzing",
            ":now": now,
            ":gsi1pk": "STATUS#analyzing",
        },
    )

    logger.info("Upload complete, analysis triggered", extra={"project_id": request.project_id})
    return {"message": "Analysis pipeline triggered", "project_id": request.project_id}
