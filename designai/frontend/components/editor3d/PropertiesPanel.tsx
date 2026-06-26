'use client';

import { useSceneStore } from '@/store/scene-store';

export function PropertiesPanel() {
  const scene = useSceneStore((s) => s.scene);
  const selectedItemId = useSceneStore((s) => s.selectedItemId);
  const updateItemColor = useSceneStore((s) => s.updateItemColor);
  const updateItemScale = useSceneStore((s) => s.updateItemScale);
  const updateItemRotation = useSceneStore((s) => s.updateItemRotation);
  const removeItem = useSceneStore((s) => s.removeItem);

  const item = scene?.items.find((i) => i.id === selectedItemId);
  if (!item) {
    return <div className="p-4 text-sm text-gray-400">Select an item to edit its properties.</div>;
  }

  const scale = item.scale?.x ?? 1;

  return (
    <div className="p-4 space-y-4 border-t">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
        <input
          type="color"
          value={item.color || '#a8a29e'}
          onChange={(e) => updateItemColor(item.id, e.target.value)}
          className="h-8 w-full rounded cursor-pointer"
        />
      </div>

      {/* Scale */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Scale: {scale.toFixed(1)}x</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={scale}
          onChange={(e) => {
            const s = parseFloat(e.target.value);
            updateItemScale(item.id, { x: s, y: s, z: s });
          }}
          className="w-full accent-amber-600"
        />
      </div>

      {/* Rotate */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Rotate</label>
        <div className="flex gap-2">
          {[90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => updateItemRotation(item.id, { x: 0, y: (deg * Math.PI) / 180, z: 0 })}
              className="flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-xs hover:bg-amber-100"
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => removeItem(item.id)}
        className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
      >
        🗑️ Delete Item
      </button>
    </div>
  );
}
