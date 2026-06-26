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
          className="w-full rounded-lg border border-[rgb(var(--line))] px-3 py-2 text-sm outline-none focus:border-[rgb(var(--accent))]"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                category === c ? 'bg-[rgb(var(--accent))] text-white' : 'bg-slate-100 text-slate-600 hover:bg-[rgb(var(--accent-soft))]'
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
              className="group rounded-xl border border-[rgb(var(--line))] bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:border-[rgb(var(--accent))] hover:shadow-md"
              title={`Add ${item.name}`}
            >
              <div className="mb-2 flex h-16 items-center justify-center rounded-lg" style={{ backgroundColor: item.color + '33' }}>
                <span className="h-8 w-8 rounded-md shadow-sm" style={{ backgroundColor: item.color }} />
              </div>
              <p className="truncate text-xs font-medium">{item.name}</p>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="text-[11px] text-[rgb(var(--muted))]">${item.price}</span>
                <span className="text-[11px] font-medium text-[rgb(var(--accent-600))] opacity-0 transition-opacity group-hover:opacity-100">+ Add</span>
              </div>
            </button>
          ))}
        </div>
        {items.length === 0 && <p className="py-6 text-center text-sm text-[rgb(var(--muted))]">No items match.</p>}
      </div>
    </div>
  );
}
