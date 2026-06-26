"""
Furniture API — OpenSearch vector search for furniture matching
Two-stage retrieval (Q3 decision): vector filter (k=20) → re-rank by keyword
"""
import os
import json
from typing import Optional

import boto3
from fastapi import APIRouter, Query
from pydantic import BaseModel
from aws_lambda_powertools import Logger

logger = Logger(child=True)
router = APIRouter()

bedrock_client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))
OPENSEARCH_ENDPOINT = os.environ.get("OPENSEARCH_ENDPOINT", "")
TITAN_EMBED_MODEL = "amazon.titan-embed-image-v1"


class FurnitureSearchResult(BaseModel):
    product_id: str
    name: str
    category: str
    style: str
    material: str
    color: str
    price: float
    image_url: str
    product_url: str
    glb_url: Optional[str] = None
    dimensions: dict
    score: float


@router.get("/")
def search_furniture(
    query: str = Query(..., description="Search query (e.g. 'teak dining table')"),
    category: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    limit: int = Query(3, ge=1, le=10),
):
    """
    Two-stage furniture retrieval:
    1. Vector search (CLIP embedding similarity) → k=20 candidates
    2. Re-rank by keyword match (category + material + price range)
    """
    # Stage 1: Generate embedding for query
    embedding = _generate_text_embedding(query)

    # Stage 2: Search OpenSearch (placeholder — returns sample data for hackathon)
    # In production, this queries OpenSearch Serverless with knn + filters
    results = _search_opensearch(embedding, category, max_price, limit)

    return {"query": query, "results": results, "total": len(results)}


def _generate_text_embedding(text: str) -> list[float]:
    """Generate CLIP text embedding using Bedrock Titan"""
    try:
        response = bedrock_client.invoke_model(
            modelId=TITAN_EMBED_MODEL,
            body=json.dumps({"inputText": text}),
            contentType="application/json",
        )
        result = json.loads(response["body"].read())
        return result.get("embedding", [0.0] * 1024)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return [0.0] * 1024


def _search_opensearch(embedding: list[float], category: Optional[str], max_price: Optional[float], limit: int) -> list[dict]:
    """
    Search OpenSearch Serverless vector index.
    For hackathon demo: returns sample furniture data.
    Production: uses opensearch-py client with knn query.
    """
    # Sample furniture catalog for demo
    sample_catalog = [
        {
            "product_id": "sofa-001",
            "name": "Scandinavian Oak Sofa",
            "category": "sofa",
            "style": "scandinavian",
            "material": "oak wood, linen",
            "color": "beige",
            "price": 899.00,
            "image_url": "https://via.placeholder.com/300x200?text=Oak+Sofa",
            "product_url": "https://amazon.com/s?k=scandinavian+oak+sofa",
            "glb_url": None,
            "dimensions": {"width": 200, "depth": 85, "height": 80},
            "score": 0.95,
        },
        {
            "product_id": "table-001",
            "name": "Minimalist Coffee Table",
            "category": "table",
            "style": "minimalist",
            "material": "walnut wood",
            "color": "dark brown",
            "price": 349.00,
            "image_url": "https://via.placeholder.com/300x200?text=Coffee+Table",
            "product_url": "https://amazon.com/s?k=minimalist+coffee+table",
            "glb_url": None,
            "dimensions": {"width": 120, "depth": 60, "height": 45},
            "score": 0.89,
        },
        {
            "product_id": "light-001",
            "name": "Brass Pendant Light",
            "category": "lighting",
            "style": "modern",
            "material": "brass",
            "color": "gold",
            "price": 199.00,
            "image_url": "https://via.placeholder.com/300x200?text=Pendant+Light",
            "product_url": "https://amazon.com/s?k=brass+pendant+light",
            "glb_url": None,
            "dimensions": {"width": 30, "depth": 30, "height": 40},
            "score": 0.87,
        },
        {
            "product_id": "chair-001",
            "name": "Japandi Accent Chair",
            "category": "chair",
            "style": "japandi",
            "material": "rattan, teak",
            "color": "natural",
            "price": 499.00,
            "image_url": "https://via.placeholder.com/300x200?text=Accent+Chair",
            "product_url": "https://amazon.com/s?k=japandi+accent+chair",
            "glb_url": None,
            "dimensions": {"width": 65, "depth": 70, "height": 85},
            "score": 0.85,
        },
        {
            "product_id": "rug-001",
            "name": "Moroccan Wool Rug",
            "category": "rug",
            "style": "bohemian",
            "material": "wool",
            "color": "cream, terracotta",
            "price": 279.00,
            "image_url": "https://via.placeholder.com/300x200?text=Wool+Rug",
            "product_url": "https://amazon.com/s?k=moroccan+wool+rug",
            "glb_url": None,
            "dimensions": {"width": 200, "depth": 150, "height": 2},
            "score": 0.82,
        },
    ]

    # Apply filters (stage 2 re-ranking)
    filtered = sample_catalog
    if category:
        filtered = [item for item in filtered if item["category"] == category]
    if max_price:
        filtered = [item for item in filtered if item["price"] <= max_price]

    return filtered[:limit]
