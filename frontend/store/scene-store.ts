/**
 * Zustand Scene Store — Single canonical scene descriptor (Q1 decision)
 * Both the pipeline writes and the editor reads this schema.
 * Zustand mutates locally; save serializes back to DynamoDB with the same schema.
 *
 * Also handles assistant action commands (Q6 decision):
 * { action: "swap_item", itemId: "sofa-01", replacementId: "sofa-07" }
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  position: Point3D;
  rotation: Point3D;
  scale: Point3D;
  modelUrl: string;
  thumbnailUrl?: string;
  dimensions?: { width: number; depth: number; height: number };
  material?: string;
  color?: string;
  productId?: string;
  productUrl?: string;
  price?: number;
  isPlaceholder?: boolean;
}

export interface RoomGeometry {
  width: number;
  length: number;
  height: number;
  roomType?: string;
}

/** A floor-plan wall segment, drawn corner-to-corner in the 2D plan (metres). */
export interface Wall {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  height: number;
  thickness: number;
}

/**
 * Taste profile produced by Qwen3-VL from the user's inspiration
 * (Pinterest images / uploads / text). Drives theme + furniture layout.
 */
export interface TasteProfile {
  styleKeywords: string[];
  primaryStyle: string;
  colorPalette: string[];
  materials: string[];
  mood: string;
  keyFurniturePieces: string[];
  lighting: string;
  avoid?: string[];
  summary: string;
  confidence: number;
}

export type EditorMode = 'select' | 'draw-wall';

export interface SceneTheme {
  name: string;
  colorPalette: string[];
  materials: string[];
  lighting: string;
}

export interface SceneDescriptor {
  projectId: string;
  userId: string;
  room: RoomGeometry;
  items: FurnitureItem[];
  walls?: Wall[];
  theme?: SceneTheme;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    status: 'draft' | 'processing' | 'ready' | 'rendered';
  };
}

interface HistoryEntry {
  items: FurnitureItem[];
  description: string;
}

interface SceneState {
  scene: SceneDescriptor | null;
  selectedItemId: string | null;
  draggingId: string | null;
  exportNonce: number;
  editorMode: EditorMode;
  draftWallStart: { x: number; z: number } | null;
  tasteProfile: TasteProfile | null;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  isDirty: boolean;

  // Actions
  loadScene: (scene: SceneDescriptor) => void;
  addItem: (item: FurnitureItem) => void;
  removeItem: (itemId: string) => void;
  updateItemPosition: (itemId: string, position: Point3D) => void;
  updateItemRotation: (itemId: string, rotation: Point3D) => void;
  updateItemScale: (itemId: string, scale: Point3D) => void;
  updateItemColor: (itemId: string, color: string) => void;
  swapItem: (itemId: string, replacement: FurnitureItem) => void;
  selectItem: (itemId: string | null) => void;
  setDraggingId: (itemId: string | null) => void;
  setTheme: (theme: SceneTheme) => void;
  requestExport: () => void;
  undo: () => void;
  redo: () => void;
  markClean: () => void;

  // Floor-plan / wall drawing (blueprint3d-style, native r3f)
  setEditorMode: (mode: EditorMode) => void;
  setDraftWallStart: (point: { x: number; z: number } | null) => void;
  addWall: (start: { x: number; z: number }, end: { x: number; z: number }) => void;
  removeWall: (wallId: string) => void;
  clearWalls: () => void;

  // Inspiration-driven taste profile (Qwen3-VL)
  setTasteProfile: (profile: TasteProfile | null) => void;

  // Assistant action dispatch (Q6 decision)
  dispatchAssistantAction: (action: AssistantAction) => void;
}

export type AssistantAction =
  | { action: 'swap_item'; itemId: string; replacement: FurnitureItem }
  | { action: 'add_item'; item: FurnitureItem }
  | { action: 'remove_item'; itemId: string }
  | { action: 'move_item'; itemId: string; position: Point3D }
  | { action: 'set_theme'; theme: SceneTheme };

export const useSceneStore = create<SceneState>()((set, get) => ({
  scene: null,
  selectedItemId: null,
  draggingId: null,
  exportNonce: 0,
  editorMode: 'select',
  draftWallStart: null,
  tasteProfile: null,
  undoStack: [],
  redoStack: [],
  isDirty: false,

  loadScene: (scene) => set({ scene: { walls: [], ...scene }, isDirty: false, undoStack: [], redoStack: [] }),

  addItem: (item) => set((state) => {
    if (!state.scene) return state;
    const undoStack = [...state.undoStack, { items: [...state.scene.items], description: `Add ${item.name}` }];
    return {
      scene: { ...state.scene, items: [...state.scene.items, item] },
      undoStack,
      redoStack: [],
      isDirty: true,
    };
  }),

  removeItem: (itemId) => set((state) => {
    if (!state.scene) return state;
    const undoStack = [...state.undoStack, { items: [...state.scene.items], description: `Remove item` }];
    return {
      scene: { ...state.scene, items: state.scene.items.filter((i) => i.id !== itemId) },
      selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      undoStack,
      redoStack: [],
      isDirty: true,
    };
  }),

  updateItemPosition: (itemId, position) => set((state) => {
    if (!state.scene) return state;
    return {
      scene: {
        ...state.scene,
        items: state.scene.items.map((i) => i.id === itemId ? { ...i, position } : i),
      },
      isDirty: true,
    };
  }),

  updateItemRotation: (itemId, rotation) => set((state) => {
    if (!state.scene) return state;
    return {
      scene: {
        ...state.scene,
        items: state.scene.items.map((i) => i.id === itemId ? { ...i, rotation } : i),
      },
      isDirty: true,
    };
  }),

  updateItemScale: (itemId, scale) => set((state) => {
    if (!state.scene) return state;
    return {
      scene: {
        ...state.scene,
        items: state.scene.items.map((i) => i.id === itemId ? { ...i, scale } : i),
      },
      isDirty: true,
    };
  }),

  updateItemColor: (itemId, color) => set((state) => {
    if (!state.scene) return state;
    return {
      scene: {
        ...state.scene,
        items: state.scene.items.map((i) => i.id === itemId ? { ...i, color } : i),
      },
      isDirty: true,
    };
  }),

  swapItem: (itemId, replacement) => set((state) => {
    if (!state.scene) return state;
    const undoStack = [...state.undoStack, { items: [...state.scene.items], description: `Swap item` }];
    return {
      scene: {
        ...state.scene,
        items: state.scene.items.map((i) => i.id === itemId ? { ...replacement, id: itemId, position: i.position, rotation: i.rotation } : i),
      },
      undoStack,
      redoStack: [],
      isDirty: true,
    };
  }),

  selectItem: (itemId) => set({ selectedItemId: itemId }),

  setDraggingId: (itemId) => set({ draggingId: itemId }),

  requestExport: () => set((s) => ({ exportNonce: s.exportNonce + 1 })),

  setTheme: (theme) => set((state) => {
    if (!state.scene) return state;
    return { scene: { ...state.scene, theme }, isDirty: true };
  }),

  undo: () => set((state) => {
    if (!state.scene || state.undoStack.length === 0) return state;
    const undoStack = [...state.undoStack];
    const prev = undoStack.pop()!;
    const redoStack = [...state.redoStack, { items: [...state.scene.items], description: 'Redo' }];
    return {
      scene: { ...state.scene, items: prev.items },
      undoStack,
      redoStack,
      isDirty: true,
    };
  }),

  redo: () => set((state) => {
    if (!state.scene || state.redoStack.length === 0) return state;
    const redoStack = [...state.redoStack];
    const next = redoStack.pop()!;
    const undoStack = [...state.undoStack, { items: [...state.scene.items], description: 'Undo' }];
    return {
      scene: { ...state.scene, items: next.items },
      undoStack,
      redoStack,
      isDirty: true,
    };
  }),

  markClean: () => set({ isDirty: false }),

  // ---- Floor-plan / wall drawing ----
  setEditorMode: (mode) => set({ editorMode: mode, draftWallStart: null }),

  setDraftWallStart: (point) => set({ draftWallStart: point }),

  addWall: (start, end) => set((state) => {
    if (!state.scene) return state;
    // Ignore zero-length walls (a click without a drag).
    const dist = Math.hypot(end.x - start.x, end.z - start.z);
    if (dist < 0.05) return { draftWallStart: null };
    const wall: Wall = {
      id: `wall-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      start,
      end,
      height: state.scene.room.height,
      thickness: 0.1,
    };
    return {
      scene: { ...state.scene, walls: [...(state.scene.walls ?? []), wall] },
      draftWallStart: null,
      isDirty: true,
    };
  }),

  removeWall: (wallId) => set((state) => {
    if (!state.scene) return state;
    return {
      scene: { ...state.scene, walls: (state.scene.walls ?? []).filter((w) => w.id !== wallId) },
      isDirty: true,
    };
  }),

  clearWalls: () => set((state) => {
    if (!state.scene) return state;
    return { scene: { ...state.scene, walls: [] }, isDirty: true };
  }),

  // ---- Inspiration taste profile ----
  setTasteProfile: (profile) => set((state) => {
    // Mirror taste palette/lighting into the scene theme so the editor reflects it.
    if (profile && state.scene) {
      const theme: SceneTheme = {
        name: profile.primaryStyle,
        colorPalette: profile.colorPalette,
        materials: profile.materials,
        lighting: profile.lighting,
      };
      return { tasteProfile: profile, scene: { ...state.scene, theme }, isDirty: true };
    }
    return { tasteProfile: profile };
  }),

  // Q6: Structured assistant action commands
  dispatchAssistantAction: (action) => {
    const store = get();
    switch (action.action) {
      case 'swap_item':
        store.swapItem(action.itemId, action.replacement);
        break;
      case 'add_item':
        store.addItem(action.item);
        break;
      case 'remove_item':
        store.removeItem(action.itemId);
        break;
      case 'move_item':
        store.updateItemPosition(action.itemId, action.position);
        break;
      case 'set_theme':
        store.setTheme(action.theme);
        break;
    }
  },
}));
