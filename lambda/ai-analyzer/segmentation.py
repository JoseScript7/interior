"""
Pipeline Stage: Room Segmentation
Uses Rekognition for object detection (hackathon; SAM2 in production)
"""
import os
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-pipeline-segmentation")
rekognition_client = boto3.client("rekognition")
s3_client = boto3.client("s3")
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET", "seeley-uploads")


def handler(event, context):
    """Detect objects and scene labels in room image"""
    image_key = event.get("imageKey", "")
    project_id = event.get("projectId", "unknown")

    logger.info("Segmentation stage", extra={"image_key": image_key, "project_id": project_id})

    try:
        # Call Rekognition for object/scene detection
        response = rekognition_client.detect_labels(
            Image={"S3Object": {"Bucket": UPLOADS_BUCKET, "Name": image_key}},
            MaxLabels=30,
            MinConfidence=70.0,
            Features=["GENERAL_LABELS"],
        )

        labels = [
            {
                "name": label["Name"],
                "confidence": round(label["Confidence"], 2),
                "categories": [cat["Name"] for cat in label.get("Categories", [])],
            }
            for label in response.get("Labels", [])
        ]

        # Categorize detected objects
        furniture_labels = [l for l in labels if any(cat in ["Furniture", "Home Improvement"] for cat in l.get("categories", []))]
        room_labels = [l for l in labels if any(cat in ["Building and Architecture", "Home and Indoors"] for cat in l.get("categories", []))]

        result = {
            "projectId": project_id,
            "imageKey": image_key,
            "allLabels": labels,
            "furniture": [l["name"] for l in furniture_labels],
            "roomFeatures": [l["name"] for l in room_labels],
            "objectCount": len(labels),
            "status": "success",
        }

        logger.info("Segmentation complete", extra={"object_count": len(labels), "furniture_count": len(furniture_labels)})
        return result

    except Exception as e:
        logger.error(f"Segmentation failed: {e}")
        return {"projectId": project_id, "error": str(e), "status": "failed"}
