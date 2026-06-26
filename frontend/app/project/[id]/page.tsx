'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Undo2, Redo2, Save, Image as ImageIcon, Box, Maximize2,
  ZoomIn, ZoomOut, Sofa, Sparkles, SlidersHorizontal, Download,
  MousePointer2, PenLine, Trash2,
} from 'lucide-react';
import { RoomEditor } from '@/components/editor3d/RoomEditor';
import { FurnitureCatalogPanel } from '@/components/catalog/FurnitureCatalogPanel';
import { PropertiesPanel } from '@/components/editor3d/PropertiesPanel';
import { InspirationPanel } from '@/components/inspiration/InspirationPanel';
import { GenerateBot } from '@/components/recommendations/GenerateBot';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSceneStore } from '@/store/scene-store';
import { DEMO_RECOMMENDATIONS } from '@/lib/catalog';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ProjectPage() {
  const projectId = (useParams().id as string) || 'demo';
  const [view, setView] = useState<'3d' | '2d'>('3d');
  const [zoom, setZoom] = useState(6);
  const [rightTab, setRightTab] = useState<'design' | 'generate' | 'properties'>('design');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const loadScene = useSceneStore((s) => s.loadScene);
  const scene = useSceneStore((s) => s.scene);
  const selectedItemId = useSceneStore((s) => s.selectedItemId);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const undoStack = useSceneStore((s) => s.undoStack);
  const redoStack = useSceneStore((s) => s.redoStack);
  const isDirty = useSceneStore((s) => s.isDirty);
  const requestExport = useSceneStore((s) => s.requestExport);
  const editorMode = useSceneStore((s) => s.editorMode);
  const setEditorMode = useSceneStore((s) => s.setEditorMode);
  const clearWalls = useSceneStore((s) => s.clearWalls);
  const wallCount = useSceneStore((s) => s.scene?.walls?.length ?? 0);

  // Initialise a scene. Try the backend; if it's not there, use a local demo scene
  // so the editor is fully functional offline.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const fallback = () => {
        if (cancelled) return;
        setRecommendations(DEMO_RECOMMENDATIONS);
        loadScene({
          projectId,
          userId: 'local',
          room: { width: 6, length: 5, height: 2.8, roomType: 'living_room' },
          items: [],
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, status: 'ready' },
        });
      };
      try {
        const res = await fetch(`${API_BASE}/local/recommend?project_id=${projectId}`, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error('no backend');
        const data = await res.json();
        if (cancelled) return;
        setRecommendations(data.recommendations?.length ? data.recommendations : DEMO_RECOMMENDATIONS);
        const dims = data.analysis?.estimatedDimensions || { width: 6, length: 5, height: 2.8 };
        loadScene({
          projectId, userId: 'user',
          room: { width: dims.width, length: dims.length, height: dims.height, roomType: data.analysis?.roomType || 'living_room' },
          items: [],
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, status: 'ready' },
        });
      } catch {
        fallback();
      }
    }
    init();
    return () => { cancelled = true; };
  }, [projectId, loadScene]);

  // switch right tab to properties when something is selected
  useEffect(() => {
    if (selectedItemId) setRightTab('properties');
  }, [selectedItemId]);

  const handleSave = () => {
    if (!scene) return;
    fetch(`${API_BASE}/local/scene`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, scene_descriptor: scene }),
    }).catch(() => {/* offline: no-op */});
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo, scene]);

  return (
    <div className="flex h-screen flex-col bg-[rgb(var(--bg))]">
      {/* Sub toolbar */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--line))] bg-[rgb(var(--surface))] px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold">See<span className="text-[rgb(var(--accent))]">ley</span></Link>
          <span className="text-xs text-[rgb(var(--muted))]">Project {projectId.slice(0, 8)} · {scene?.items.length ?? 0} items</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!undoStack.length} className="tool-btn disabled:opacity-30" title="Undo (Ctrl+Z)"><Undo2 size={18} /></button>
          <button onClick={redo} disabled={!redoStack.length} className="tool-btn disabled:opacity-30" title="Redo (Ctrl+Shift+Z)"><Redo2 size={18} /></button>
          <div className="mx-1 h-5 w-px bg-[rgb(var(--line))]" />
          <ThemeToggle />
          <button onClick={handleSave} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${isDirty ? 'bg-[rgb(var(--accent))] text-black' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))]'}`}><Save size={15} /> Save</button>
          <button onClick={() => requestExport()} className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--surface-2))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--ink))] hover:bg-[rgb(var(--accent-soft))]" title="Export the room as a .glb 3D file"><Download size={15} /> Export</button>
          <button className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-medium text-white" title="Generate photorealistic render (needs cloud backend)"><ImageIcon size={15} /> Render</button>
        </div>
      </div>

      {/* 3-pane workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: catalog */}
        <aside className="flex w-64 flex-col border-r border-[rgb(var(--line))] bg-[rgb(var(--surface))]">
          <div className="flex items-center gap-2 border-b border-[rgb(var(--line))] px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))]">
            <Sofa size={15} /> CATALOG
          </div>
          <div className="flex-1 overflow-hidden"><FurnitureCatalogPanel /></div>
        </aside>

        {/* Center: canvas */}
        <div className="relative flex-1 bg-gradient-to-br from-[rgb(var(--bg))] to-[rgb(var(--surface-2))]">
          <RoomEditor view={view} zoom={zoom} />

          {/* Empty hint */}
          {scene && scene.items.length === 0 && (
            <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-[rgb(var(--surface))]/90 px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm">
              ← Click any furniture in the catalog to place it in the room
            </div>
          )}

          {/* Bottom-center 2D/3D toggle + floor-plan wall tools */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
            <div className="seg">
              <button onClick={() => setView('2d')} className={`seg-item flex items-center gap-1.5 ${view === '2d' ? 'seg-item-active' : ''}`}><Maximize2 size={14} /> 2D</button>
              <button onClick={() => setView('3d')} className={`seg-item flex items-center gap-1.5 ${view === '3d' ? 'seg-item-active' : ''}`}><Box size={14} /> 3D</button>
            </div>
            <div className="seg">
              <button onClick={() => setEditorMode('select')} className={`seg-item flex items-center gap-1.5 ${editorMode === 'select' ? 'seg-item-active' : ''}`} title="Select & move furniture"><MousePointer2 size={14} /> Select</button>
              <button onClick={() => { setEditorMode('draw-wall'); setView('2d'); }} className={`seg-item flex items-center gap-1.5 ${editorMode === 'draw-wall' ? 'seg-item-active' : ''}`} title="Draw walls: click a start corner, click again to place"><PenLine size={14} /> Walls</button>
            </div>
            {wallCount > 0 && (
              <button onClick={clearWalls} className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--line))] bg-[rgb(var(--surface))]/95 px-3 py-1.5 text-xs text-[rgb(var(--muted))] shadow-sm hover:text-red-500" title="Clear all drawn walls"><Trash2 size={14} /> {wallCount}</button>
            )}
          </div>

          {/* Wall drawing hint */}
          {editorMode === 'draw-wall' && (
            <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-[rgb(var(--surface))]/90 px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm">
              Click a start corner, then click again to place a wall · click a wall to delete it
            </div>
          )}

          {/* Zoom controls bottom-left */}
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-[rgb(var(--line))] bg-[rgb(var(--surface))]/95 px-3 py-1.5 shadow-sm">
            <button onClick={() => setZoom((z) => Math.min(14, z + 1))} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]" title="Zoom out"><ZoomOut size={16} /></button>
            <input type="range" min={3} max={14} step={0.5} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-28 accent-[rgb(var(--accent))]" />
            <button onClick={() => setZoom((z) => Math.max(3, z - 1))} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]" title="Zoom in"><ZoomIn size={16} /></button>
          </div>
        </div>

        {/* Right: design / generate / properties */}
        <aside className="flex w-80 flex-col border-l border-[rgb(var(--line))] bg-[rgb(var(--surface))]">
          <div className="flex border-b border-[rgb(var(--line))]">
            <button onClick={() => setRightTab('design')} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold ${rightTab === 'design' ? 'border-b-2 border-[rgb(var(--accent))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--muted))]'}`}><Sparkles size={14} /> Designs</button>
            <button onClick={() => setRightTab('generate')} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold ${rightTab === 'generate' ? 'border-b-2 border-[rgb(var(--accent))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--muted))]'}`}><Box size={14} /> Generate</button>
            <button onClick={() => setRightTab('properties')} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold ${rightTab === 'properties' ? 'border-b-2 border-[rgb(var(--accent))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--muted))]'}`}><SlidersHorizontal size={14} /> Edit</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'design' && <InspirationPanel projectId={projectId} />}
            {rightTab === 'generate' && <GenerateBot />}
            {rightTab === 'properties' && <PropertiesPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
