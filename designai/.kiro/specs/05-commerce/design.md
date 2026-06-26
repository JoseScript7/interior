# Design — Furniture Matching & Commerce

## Retrieval (Functional Q3)
`services/opensearch.py`: `vector_search(k=20)` → `keyword_rerank` (category 0.4 / material 0.3 / price 0.2 / style 0.1) → top 3. Embeddings via Bedrock Titan.

## Index
`furniture-index` mapping in `furniture-catalog.json` / `.schema.ts` (knn_vector 1536, cosine, hnsw).

## Frontend
`ProductCard` (thumbnail/name/price, Add to Scene → store.addItem, View on Amazon, Find Similar). Rendered under each recommendation.

## Seed
`seed/products.json` (12 sample items) → indexed at deploy via seed script.

## Contracts
`FurnitureCatalogItem` (`furniture-catalog.json`), `/assets` response.
