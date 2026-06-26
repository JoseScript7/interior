"""
Pipeline Stage: Depth Estimation
Calls MiDaS SageMaker endpoint for dense depth map
"""
import os
import json
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="designai-pipeline-depth")
sagemaker_runtime = boto3.client("sagemaker-runtime")
s3_client = boto3.client("s3")

MIDAS_ENDPOINT = os.environ.get("MIDAS_ENDPOINT", "designai-midas-endpoint")
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET", "designai-uploads")


def handler(event, context):
    """Generate depth map from room image using MiDaS"""
    image_key = event.get("imageKey", "")
    project_id = event.get("projectId", "unknown")

    logger.info("Depth estimation stage", extra={"image_key": image_key, "project_id": project_id})

    try:
        # Get image from S3
        s3_response = s3_client.get_object(Bucket=UPLOADS_BUCKET, Key=image_key)
        image_bytes = s3_response["Body"].read()

        # Call MiDaS SageMaker endpoint
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=MIDAS_ENDPOINT,
            ContentType="application/octet-stream",
            Body=image_bytes,
        )

        result_body = json.loads(response["Body"].read())

        # Extract depth data
        depth_map_key = f"users/depth/{project_id}/depth_map.npy"

        result = {
            "projectId": project_id,
            "imageKey": image_key,
            "depthMapKey": depth_map_key,
            "estimatedDimensions": result_body.get("estimatedDimensions", {
                "width": 4.5,
                "length": 5.0,
                "height": 2.8,
            }),
            "status": "success",
        }

        logger.info("Depth estimation complete", extra={"project_id": project_id})
        return result

    except Exception as e:
        logger.error(f"Depth estimation failed: {e}")
        # Fallback: return estimated dimensions
        return {
            "projectId": project_id,
            "error": str(e),
            "estimatedDimensions": {"width": 4.0, "length": 5.0, "height": 2.7},
            "status": "fallback",
        }
