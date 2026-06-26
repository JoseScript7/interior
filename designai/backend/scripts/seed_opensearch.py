"""
Seed the OpenSearch Serverless furniture-index from seed/products.json.

Pipeline:
  1. Connect to OpenSearch Serverless with SigV4 auth.
  2. Create `furniture-index` with knn_vector mapping if it doesn't exist.
  3. For each product, build an embedding text and call Bedrock Titan for a 1536-dim vector.
  4. Bulk-index the products.
  5. Run a few sample queries to confirm retrieval returns sane results (RAID retrieve-before-generate).

Usage:
  python -m scripts.seed_opensearch ../seed/products.json
  python -m scripts.seed_opensearch ../seed/products.json --dry-run       # embed + validate, no indexing
  python -m scripts.seed_opensearch ../seed/products.json --verify-only    # just run sample queries

Env vars (see .env.example):
  AWS_REGION_NAME            default us-east-1
  OPENSEARCH_ENDPOINT        e.g. abcd1234.us-east-1.aoss.amazonaws.com  (no https://)
  TITAN_EMBED_MODEL          default amazon.titan-embed-image-v1
  OPENSEARCH_INDEX           default furniture-index
"""
import argparse
import json
import os
import sys
import time

import boto3

REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")
OPENSEARCH_ENDPOINT = os.environ.get("OPENSEARCH_ENDPOINT", "").replace("https://", "").strip("/")
TITAN_EMBED_MODEL = os.environ.get("TITAN_EMBED_MODEL", "amazon.titan-embed-image-v1")
INDEX_NAME = os.environ.get("OPENSEARCH_INDEX", "furniture-index")
EMBED_DIM = 1024

# knn_vector index mapping (mirrors shared/contracts/furniture-catalog.json)
INDEX_BODY = {
    "settings": {"index": {"knn": True, "knn.algo_param.ef_search": 100}},
    "mappings": {
        "properties": {
            "productId": {"type": "keyword"},
            "name": {"type": "text"},
            "category": {"type": "keyword"},
            "style": {"type": "keyword"},
            "material": {"type": "keyword"},
            "color": {"type": "keyword"},
            "price": {"type": "float"},
            "currency": {"type": "keyword"},
            "imageUrl": {"type": "keyword", "index": False},
            "productUrl": {"type": "keyword", "index": False},
            "glbUrl": {"type": "keyword", "index": False},
            "dimensions": {
                "properties": {
                    "width": {"type": "float"},
                    "depth": {"type": "float"},
                    "height": {"type": "float"},
                }
            },
            "tags": {"type": "keyword"},
            "embedding": {
                "type": "knn_vector",
                "dimension": EMBED_DIM,
                "method": {
                    "name": "hnsw",
                    "space_type": "cosinesimil",
                    "engine": "nmslib",
                    "parameters": {"ef_construction": 128, "m": 16},
                },
            },
        }
    },
}


def get_client():
    """OpenSearch client with SigV4 auth for OpenSearch Serverless (aoss)."""
    try:
        from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
    except ImportError:
        sys.exit("Missing dependency: pip install opensearch-py")

    if not OPENSEARCH_ENDPOINT:
        sys.exit("OPENSEARCH_ENDPOINT env var is required (host only, no https://).")

    credentials = boto3.Session().get_credentials()
    # 'aoss' for Serverless; use 'es' for managed OpenSearch domains.
    service = "aoss" if OPENSEARCH_ENDPOINT.endswith("aoss.amazonaws.com") else "es"
    auth = AWSV4SignerAuth(credentials, REGION, service)

    return OpenSearch(
        hosts=[{"host": OPENSEARCH_ENDPOINT, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=20,
    )


def embedding_text(product: dict) -> str:
    """Compose the text used to generate the CLIP/Titan embedding."""
    parts = [
        product.get("name", ""),
        product.get("style", ""),
        product.get("material", ""),
        product.get("color", ""),
        product.get("category", ""),
        " ".join(product.get("tags", [])),
    ]
    return ", ".join(p for p in parts if p)


def generate_embedding(bedrock, text: str) -> list:
    """Generate a 1536-dim embedding via Bedrock Titan."""
    response = bedrock.invoke_model(
        modelId=TITAN_EMBED_MODEL,
        body=json.dumps({"inputText": text}),
        contentType="application/json",
        accept="application/json",
    )
    result = json.loads(response["body"].read())
    vec = result.get("embedding", [])
    if len(vec) != EMBED_DIM:
        # Pad/truncate defensively so indexing never fails on dimension mismatch.
        vec = (vec + [0.0] * EMBED_DIM)[:EMBED_DIM]
    return vec


def ensure_index(client):
    if client.indices.exists(index=INDEX_NAME):
        print(f"Index '{INDEX_NAME}' already exists.")
        return
    client.indices.create(index=INDEX_NAME, body=INDEX_BODY)
    print(f"Created index '{INDEX_NAME}'.")


def load_products(path: str) -> list:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("products", data if isinstance(data, list) else [])


def seed(path: str, dry_run: bool):
    bedrock = boto3.client("bedrock-runtime", region_name=REGION)
    products = load_products(path)
    print(f"Loaded {len(products)} products from {path}")

    enriched = []
    for i, product in enumerate(products, 1):
        text = embedding_text(product)
        vec = generate_embedding(bedrock, text)
        product = {**product, "embedding": vec}
        enriched.append(product)
        print(f"  [{i}/{len(products)}] embedded: {product.get('name')} (dim={len(vec)})")

    if dry_run:
        print("Dry run — embeddings generated and validated, skipping indexing.")
        return

    client = get_client()
    ensure_index(client)

    # Bulk index
    bulk_lines = []
    for product in enriched:
        bulk_lines.append(json.dumps({"index": {"_index": INDEX_NAME, "_id": product["productId"]}}))
        bulk_lines.append(json.dumps(product))
    body = "\n".join(bulk_lines) + "\n"

    resp = client.bulk(body=body)
    errors = resp.get("errors", False)
    print(f"Bulk indexed {len(enriched)} products. errors={errors}")
    if errors:
        for item in resp.get("items", []):
            idx = item.get("index", {})
            if idx.get("error"):
                print(f"  ERROR {idx.get('_id')}: {idx['error']}")

    # OpenSearch Serverless is near-real-time; give it a moment before verifying.
    time.sleep(3)
    verify(client, bedrock)


def verify(client=None, bedrock=None):
    """Run a few sample queries to confirm retrieval returns sane results."""
    client = client or get_client()
    bedrock = bedrock or boto3.client("bedrock-runtime", region_name=REGION)

    sample_queries = [
        "scandinavian oak sofa",
        "brass pendant light",
        "warm minimalist coffee table",
    ]
    print("\n--- Sample retrieval checks (vector k=20 → top 3) ---")
    for q in sample_queries:
        vec = generate_embedding(bedrock, q)
        body = {
            "size": 3,
            "query": {"knn": {"embedding": {"vector": vec, "k": 20}}},
            "_source": ["productId", "name", "category", "price"],
        }
        resp = client.search(index=INDEX_NAME, body=body)
        hits = resp.get("hits", {}).get("hits", [])
        print(f"\nQuery: '{q}' → {len(hits)} hits")
        for h in hits:
            src = h["_source"]
            print(f"  {src['name']} ({src['category']}, ${src.get('price')}) score={h['_score']:.3f}")


def main():
    parser = argparse.ArgumentParser(description="Seed OpenSearch furniture-index.")
    parser.add_argument("products", nargs="?", default="../seed/products.json", help="Path to products.json")
    parser.add_argument("--dry-run", action="store_true", help="Embed + validate, no indexing")
    parser.add_argument("--verify-only", action="store_true", help="Only run sample queries against existing index")
    args = parser.parse_args()

    if args.verify_only:
        verify()
    else:
        seed(args.products, args.dry_run)


if __name__ == "__main__":
    main()
