'use client';

import { useSceneStore, FurnitureItem } from '@/store/scene-store';

interface Product {
  product_id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
  product_url: string;
  glb_url?: string | null;
  dimensions: { width: number; depth: number; height: number };
}

interface Props {
  product: Product;
  onFindSimilar?: (product: Product) => void;
}

export function ProductCard({ product, onFindSimilar }: Props) {
  const addItem = useSceneStore((s) => s.addItem);

  const handleAddToScene = () => {
    const item: FurnitureItem = {
      id: `${product.product_id}-${Date.now().toString(36)}`,
      name: product.name,
      category: product.category,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      modelUrl: product.glb_url || '',
      dimensions: {
        width: product.dimensions.width / 100,
        depth: product.dimensions.depth / 100,
        height: product.dimensions.height / 100,
      },
      productId: product.product_id,
      productUrl: product.product_url,
      price: product.price,
      isPlaceholder: !product.glb_url,
    };
    addItem(item);
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <img src={product.image_url} alt={product.name} className="h-32 w-full object-cover bg-gray-100" />
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-lg font-semibold text-amber-700 mt-1">${product.price.toLocaleString()}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={handleAddToScene} className="flex-1 rounded-lg bg-amber-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-amber-500">
            + Add to Scene
          </button>
          <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 text-center hover:bg-gray-200">
            View on Amazon
          </a>
        </div>
        {onFindSimilar && (
          <button onClick={() => onFindSimilar(product)} className="mt-2 w-full text-xs text-amber-600 hover:underline">
            Find Similar
          </button>
        )}
      </div>
    </div>
  );
}
