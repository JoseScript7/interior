"""
Pipeline Stage: Asset Retrieval
Two-stage retrieval (Q3 decision): vector search → keyword re-rank
Retrieval-first strategy (Chapter 14): reuse GLB before generating
"""
import os
import json
import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="seeley-pipeline-asset-retrieval")
bedrock_client = boto3.client("bedrock-runtime")
s3_client = boto3.client("s3")

ASSETS_BUCKET = os.environ.get("ASSETS_BUCKET", "seeley-assets")
TITAN_EMBED_MODEL = "amazon.titan-embed-image-v1"
OPENSEARCH_ENDPOINT = os.environ.get("OPENSEARCH_ENDPOINT", "")


def handler(event, context):
    """Retrieve furniture assets from catalog (retrieval-first strategy)"""
    project_id = event.get("projectId", "unknown")
    recommendations = event.get("recommendations", {})

    logger.info("Asset retrieval stage", extra={"project_id": project_id})

    furniture_list = []
    recs = recommendations.get("recommendations", [])
    if recs:
        furniture_list = recs[0].get("furnitureList", [])

    retrieved_assets = []
    all_found = True

    for furniture in furniture_list[:10]:
        query = furniture.get("searchQuery", furniture.get("name", ""))
        category = furniture.get("category", "")

        # Stage 1: Generate embedding
        embedding = _generate_embedding(query)

        # Stage 2: Search catalog (OpenSearch in production, sample data for hackathon)
        asset = _search_catalog(query, category, embedding)

        if asset:
            retrieved_assets.append(asset)
        else:
            all_found = False
            # Mark as placeholder — will be generated async (Q5 decision)
            retrieved_assets.append({
                "name": furniture.get("name", "Unknown"),
                "category": category,
                "glbUrl": "",
                "isPlaceholder": True,
            })

    logger.info("Asset retrieval complete", extra={
        "total": len(furniture_list),
        "found": sum(1 for a in retrieved_assets if not a.get("isPlaceholder")),
    })

    return {
        "projectId": project_id,
        "assets": retrieved_assets,
        "allAssetsFound": all_found,
        "status": "success",
    }


def _generate_embedding(text: str) -> list:
    """Generate text embedding using Bedrock Titan"""
    try:
        response = bedrock_client.invoke_model(
            modelId=TITAN_EMBED_MODEL,
            body=json.dumps({"inputText": text}),
            contentType="application/json",
        )
        result = json.loads(response["body"].read())
        return result.get("embedding", [])
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return []


def _search_catalog(query: str, category: str, embedding: list) -> dict | None:
    """
    Two-stage retrieval:
    1. Vector similarity (k=20 candidates)
    2. Re-rank by keyword match (category, material, price)

    For hackathon: returns from sample catalog
    Production: queries OpenSearch Serverless
    """
    # Sample assets (in production, this queries OpenSearch)
    sample_assets = {
        "sofa": {"name": "Modern Sofa", "category": "sofa", "glbUrl": f"https://cdn.seeley.app/assets/sofa-01.glb", "isPlaceholder": False},
        "chair": {"name": "Accent Chair", "category": "chair", "glbUrl": f"https://cdn.seeley.app/assets/chair-01.glb", "isPlaceholder": False},
        "table": {"name": "Coffee Table", "category": "table", "glbUrl": f"https://cdn.seeley.app/assets/table-01.glb", "isPlaceholder": False},
        "lighting": {"name": "Pendant Light", "category": "lighting", "glbUrl": f"https://cdn.seeley.app/assets/light-01.glb", "isPlaceholder": False},
        "rug": {"name": "Area Rug", "category": "rug", "glbUrl": f"https://cdn.seeley.app/assets/rug-01.glb", "isPlaceholder": False},
        "storage": {"name": "Bookshelf", "category": "storage", "glbUrl": f"https://cdn.seeley.app/assets/shelf-01.glb", "isPlaceholder": False},
    }

    return sample_assets.get(category)
