'use client';

import { useMemo, useState } from 'react';
import { useSceneStore, FurnitureItem } from '@/store/scene-store';
import { CATALOG, CATEGORIES, CatalogItem } from '@/lib/catalog';

/**
 * Furniture catalog — fully offline. Click an item to drop it into the scene.
 * No backend required; data comes from lib/catalog.ts.
 */
export function FurnitureCatalogPanel() {
  const addItem = useSceneStore((s) => s.addItem);
  const itemCount = useSceneStore((s) => s.scene?.items.length ?? 0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const items = useMemo(() => {
    return CATALOG.filter((it) => {
      if (category !== 'all' && it.category !== category) return false;
      if (search && !`${it.name} ${it.style} ${it.material}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, category]);

  const handleAdd = (item: CatalogItem) => {
    // Spread new items around the room so they don't stack on top of each other.
    const n = itemCount;
    const x = ((n % 3) - 1) * 1.4;
    const z = (Math.floor(n / 3) % 3 - 1) * 1.4;
    const newItem: FurnitureItem = {
      id: `${item.productId}-${Date.now().toString(36)}`,
      name: item.name,
      category: item.category,
      position: { x, y: 0, z },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      modelUrl: '',
      dimensions: { width: item.dimensions.width / 100, depth: item.dimensions.depth / 100, height: item.dimensions.height / 100 },
      color: item.color,
      productId: item.productId,
      productUrl: item.productUrl,
      price: item.price,
      isPlaceholder: true,
    };
    addItem(newItem);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[rgb(var(--line))] p-3">
        <h2 className="mb-2 text-sm font-semibold">Furniture catalog</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--surface-2))] px-3 py-2 text-sm text-[rgb(var(--ink))] outline-none placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--accent))]"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                category === c ? 'bg-[rgb(var(--accent))] text-black' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))] hover:text-[rgb(var(--ink))]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <button
              key={item.productId}
              onClick={() => handleAdd(item)}
              className="group overflow-hidden rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--surface-2))] text-left transition-all hover:-translate-y-0.5 hover:border-[rgb(var(--accent))] hover:shadow-lg"
              title={`Add ${item.name}`}
            >
              <div className="relative h-24 w-full overflow-hidden bg-[rgb(var(--surface))]">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">+ Add</span>
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-[rgb(var(--ink))]">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-[rgb(var(--muted))]">${item.price} · {item.style}</p>
              </div>
            </button>
          ))}
        </div>
        {items.length === 0 && <p className="py-6 text-center text-sm text-[rgb(var(--muted))]">No items match.</p>}
      </div>
    </div>
  );
}
