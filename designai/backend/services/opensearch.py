"""
OpenSearch Service Wrapper
Vector search for furniture matching (two-stage retrieval per Q3 decision)
"""
import os
from typing import Optional
from aws_lambda_powertools import Logger

logger = Logger(child=True)

OPENSEARCH_ENDPOINT = os.environ.get("OPENSEARCH_ENDPOINT", "")
INDEX_NAME = "furniture-catalog"


class OpenSearchService:
    def __init__(self):
        self.endpoint = OPENSEARCH_ENDPOINT

    def vector_search(self, embedding: list[float], k: int = 20, category_filter: Optional[str] = None) -> list[dict]:
        """
        Stage 1: Vector similarity search (k candidates)
        Returns top-k items by cosine similarity to the query embedding
        """
        # In production: use opensearch-py client
        # from opensearchpy import OpenSearch, RequestsHttpConnection
        # client = OpenSearch(hosts=[self.endpoint], ...)
        #
        # query = {
        #     "size": k,
        #     "query": {
        #         "knn": {
        #             "embedding": {
        #                 "vector": embedding,
        #                 "k": k
        #             }
        #         }
        #     }
        # }
        #
        # if category_filter:
        #     query["query"] = {
        #         "bool": {
        #             "must": [{"knn": {"embedding": {"vector": embedding, "k": k}}}],
        #             "filter": [{"term": {"category": category_filter}}]
        #         }
        #     }
        logger.info("Vector search", extra={"k": k, "category": category_filter})
        return []

    def keyword_rerank(self, candidates: list[dict], keywords: dict) -> list[dict]:
        """
        Stage 2: Re-rank vector candidates by keyword match
        Filters by category, material, price range
        """
        scored = []
        for item in candidates:
            score = 0.0
            if keywords.get("category") and item.get("category") == keywords["category"]:
                score += 0.4
            if keywords.get("material") and keywords["material"].lower() in item.get("material", "").lower():
                score += 0.3
            if keywords.get("max_price") and item.get("price", 0) <= keywords["max_price"]:
                score += 0.2
            if keywords.get("style") and keywords["style"].lower() in item.get("style", "").lower():
                score += 0.1
            scored.append({**item, "rerank_score": score})

        scored.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored

    def hybrid_search(self, embedding: list[float], keywords: dict, limit: int = 3) -> list[dict]:
        """
        Complete two-stage retrieval:
        1. Vector search (k=20 candidates)
        2. Keyword re-rank → return top `limit`
        """
        candidates = self.vector_search(embedding, k=20, category_filter=keywords.get("category"))
        reranked = self.keyword_rerank(candidates, keywords)
        return reranked[:limit]


# Singleton
opensearch_service = OpenSearchService()
