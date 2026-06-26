/**
 * Furniture Catalog Schema - OpenSearch index structure
 * Two-stage retrieval: vector filter (k=20) then re-rank by keyword
 */

export interface FurnitureCatalogItem {
  productId: string;
  name: string;
  category: 'sofa' | 'chair' | 'table' | 'bed' | 'storage' | 'lighting' | 'decor' | 'rug' | 'other';
  style: string;
  material: string;
  color: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  glbUrl?: string;
  dimensions: {
    width: number;   // cm
    depth: number;   // cm
    height: number;  // cm
  };
  embedding?: number[];  // 1024-dim Titan embedding vector
  tags: string[];
}

// OpenSearch index mapping
export const furnitureCatalogMapping = {
  mappings: {
    properties: {
      productId: { type: 'keyword' },
      name: { type: 'text', analyzer: 'standard' },
      category: { type: 'keyword' },
      style: { type: 'keyword' },
      material: { type: 'keyword' },
      color: { type: 'keyword' },
      price: { type: 'float' },
      currency: { type: 'keyword' },
      imageUrl: { type: 'keyword', index: false },
      productUrl: { type: 'keyword', index: false },
      glbUrl: { type: 'keyword', index: false },
      dimensions: {
        properties: {
          width: { type: 'float' },
          depth: { type: 'float' },
          height: { type: 'float' },
        },
      },
      embedding: {
        type: 'knn_vector',
        dimension: 1024,
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'nmslib',
          parameters: {
            ef_construction: 128,
            m: 16,
          },
        },
      },
      tags: { type: 'keyword' },
    },
  },
} as const;
