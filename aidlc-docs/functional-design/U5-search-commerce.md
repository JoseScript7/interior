# U5 — Search & Commerce Functional Design

## OpenSearch query logic (Functional Q3)
Two-stage retrieval:
1. **Vector** — knn on `embedding` (1536-dim, cosine, hnsw), k=20 candidates, optional category pre-filter.
2. **Keyword re-rank** — score by category match (0.4), material (0.3), price ≤ max (0.2), style (0.1); sort desc; return top `limit`.

## Index mapping
`furniture-index` (see `shared/contracts/furniture-catalog.json` + `furniture-catalog.schema.ts` mapping): productId(keyword), name(text), category/style/material/color(keyword), price(float), dimensions(object), embedding(knn_vector 1536), tags(keyword).

## PA-API mapping
Hackathon: sample data (`seed/products.json`), `productUrl` → amazon.com search. No live PA-API.

## Cache strategy
Redis caches recommendation results + popular furniture queries (FR14). Embeddings cached per query string.
