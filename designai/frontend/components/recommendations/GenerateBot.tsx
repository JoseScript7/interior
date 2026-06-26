'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, SendHorizonal, Loader2, Plus } from 'lucide-react';
import { useSceneStore, FurnitureItem } from '@/store/scene-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface GenMsg { role: 'user' | 'bot'; text: string; item?: any }

/**
 * AI "bot" in the AI Suggestions tab. The user describes an object
 * ("a tall amber glass bottle, 30cm") -> Bedrock structures it -> Hunyuan3D
 * (when the GPU endpoint exists) or a procedural placeholder is added to the
 * 3D scene, draggable immediately.
 */
export function GenerateBot() {
  const addItem = useSceneStore((s) => s.addItem);
  const itemCount = useSceneStore((s) => s.scene?.items.length ?? 0);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<GenMsg[]>([
    { role: 'bot', text: 'Describe any object and I’ll generate it into your room — e.g. “a tall amber glass bottle, ~30cm” or “a round teak side table”.' },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log, busy]);

  const placeItem = (item: any) => {
    const n = itemCount;
    const x = ((n % 3) - 1) * 1.3;
    const z = (Math.floor(n / 3) % 3 - 1) * 1.3;
    const fi: FurnitureItem = {
      id: `${item.productId}-${Date.now().toString(36)}`,
      name: item.name,
      category: item.category,
      position: { x, y: 0, z },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      modelUrl: item.glbUrl || '',
      dimensions: {
        width: (item.dimensions?.width ?? 40) / 100,
        depth: (item.dimensions?.depth ?? 40) / 100,
        height: (item.dimensions?.height ?? 40) / 100,
      },
      color: item.color,
      productId: item.productId,
      price: item.price,
      isPlaceholder: !item.glbUrl,
    };
    addItem(fi);
  };

  const submit = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setPrompt('');
    setLog((l) => [...l, { role: 'user', text }]);
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/local/generate3d`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      if (!res.ok) throw new Error(`gen ${res.status}`);
      const { item } = await res.json();
      placeItem(item);
      const src = item.generatedByHunyuan3D ? 'Hunyuan3D (GPU)' : 'placeholder (Hunyuan3D GPU endpoint not deployed)';
      setLog((l) => [...l, { role: 'bot', text: `Added “${item.name}” (${item.category}, ${item.dimensions?.width}×${item.dimensions?.depth}×${item.dimensions?.height}cm) via ${src}. Drag it to position it.`, item }]);
    } catch {
      setLog((l) => [...l, { role: 'bot', text: 'Generation failed — the AI backend may be offline. Check the server is running.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[rgb(var(--line))] px-4 py-3 text-sm font-semibold">
        <Sparkles size={15} className="text-[rgb(var(--accent))]" /> AI Object Generator
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {log.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-ink))]' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--ink))]'}`}>
              {m.text}
              {m.item && (
                <button
                  onClick={() => placeItem(m.item)}
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-[rgb(var(--surface))] px-2 py-1 text-[11px] font-medium text-[rgb(var(--accent))]"
                >
                  <Plus size={12} /> Add again
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
              <Loader2 size={14} className="animate-spin" /> Generating 3D object…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-[rgb(var(--line))] p-3">
        <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--surface-2))] px-3 py-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Describe an object to generate…"
            disabled={busy}
            className="flex-1 bg-transparent text-sm text-[rgb(var(--ink))] outline-none placeholder:text-[rgb(var(--muted))]"
          />
          <button onClick={submit} disabled={busy || !prompt.trim()} className="text-[rgb(var(--accent))] disabled:opacity-30">
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
