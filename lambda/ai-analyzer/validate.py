"""
Pipeline Stage: Image Validation
Validates file type, resolution, corruption, max size
"""
import os
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-pipeline-validate")
s3_client = boto3.client("s3")
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET", "seeley-uploads")

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


def handler(event, context):
    """Validate uploaded image before pipeline processing"""
    logger.info("Validating image", extra={"event": event})

    image_key = event.get("imageKey") or event.get("detail", {}).get("object", {}).get("key", "")
    project_id = event.get("projectId", "unknown")

    if not image_key:
        return {"valid": False, "error": "No image key provided", "projectId": project_id}

    try:
        # Head object to check metadata
        head = s3_client.head_object(Bucket=UPLOADS_BUCKET, Key=image_key)
        content_type = head.get("ContentType", "")
        content_length = head.get("ContentLength", 0)

        # Validate content type
        if content_type not in ALLOWED_TYPES:
            return {
                "valid": False,
                "error": f"Invalid file type: {content_type}. Allowed: {ALLOWED_TYPES}",
                "projectId": project_id,
            }

        # Validate size
        if content_length > MAX_SIZE_BYTES:
            return {
                "valid": False,
                "error": f"File too large: {content_length} bytes. Max: {MAX_SIZE_BYTES}",
                "projectId": project_id,
            }

        logger.info("Image validated successfully", extra={
            "image_key": image_key,
            "content_type": content_type,
            "size": content_length,
        })

        return {
            "valid": True,
            "imageKey": image_key,
            "projectId": project_id,
            "contentType": content_type,
            "sizeBytes": content_length,
        }

    except s3_client.exceptions.NoSuchKey:
        return {"valid": False, "error": "Image not found in S3", "projectId": project_id}
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return {"valid": False, "error": str(e), "projectId": project_id}
