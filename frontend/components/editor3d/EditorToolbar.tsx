'use client';

import { useSceneStore } from '@/store/scene-store';

interface Props {
  view: '3d' | '2d';
  onViewChange: (v: '3d' | '2d') => void;
  onSave: () => void;
  onRender: () => void;
  onArPreview: () => void;
}

export function EditorToolbar({ view, onViewChange, onSave, onRender, onArPreview }: Props) {
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const undoStack = useSceneStore((s) => s.undoStack);
  const redoStack = useSceneStore((s) => s.redoStack);
  const isDirty = useSceneStore((s) => s.isDirty);

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => onViewChange('3d')}
          className={`px-3 py-1.5 text-xs font-medium ${view === '3d' ? 'bg-amber-100 text-amber-700' : 'text-gray-600'}`}
        >
          3D
        </button>
        <button
          onClick={() => onViewChange('2d')}
          className={`px-3 py-1.5 text-xs font-medium ${view === '2d' ? 'bg-amber-100 text-amber-700' : 'text-gray-600'}`}
        >
          2D
        </button>
      </div>

      <button onClick={undo} disabled={undoStack.length === 0} className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30" title="Undo (Cmd+Z)">↩️</button>
      <button onClick={redo} disabled={redoStack.length === 0} className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30" title="Redo (Cmd+Shift+Z)">↪️</button>

      <button onClick={onSave} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${isDirty ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>💾 Save</button>
      <button onClick={onArPreview} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">📱 AR</button>
      <button onClick={onRender} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500">🖼️ Render</button>
    </div>
  );
}
