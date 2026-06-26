/**
 * Scene Descriptor Schema (JSON Schema draft-07)
 * Single canonical scene descriptor JSON loaded into Zustand.
 * Both the pipeline writes and the editor reads this schema.
 * Zustand mutates locally; save serializes back to DynamoDB.
 */
export const sceneDescriptorSchema = {
  title: 'SceneDescriptor',
  type: 'object',
  required: ['projectId', 'userId', 'room', 'items', 'metadata'],
  properties: {
    projectId: { type: 'string' },
    userId: { type: 'string' },
    room: {
      type: 'object',
      required: ['width', 'length', 'height'],
      properties: {
        width: { type: 'number', description: 'Room width in meters' },
        length: { type: 'number', description: 'Room length in meters' },
        height: { type: 'number', description: 'Ceiling height in meters' },
        roomType: { type: 'string', enum: ['living_room', 'bedroom', 'kitchen', 'bathroom', 'office', 'dining_room', 'other'] },
        walls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              start: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
              end: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
              height: { type: 'number' },
              material: { type: 'string' },
              color: { type: 'string' },
            },
          },
        },
        windows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              wallId: { type: 'string' },
              position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
              width: { type: 'number' },
              height: { type: 'number' },
            },
          },
        },
        doors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              wallId: { type: 'string' },
              position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
              width: { type: 'number' },
              height: { type: 'number' },
            },
          },
        },
      },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'position', 'rotation', 'scale', 'modelUrl'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', enum: ['sofa', 'chair', 'table', 'bed', 'storage', 'lighting', 'decor', 'rug', 'other'] },
          position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
          rotation: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
          scale: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
          modelUrl: { type: 'string', description: 'CloudFront URL to .glb file' },
          thumbnailUrl: { type: 'string' },
          dimensions: { type: 'object', properties: { width: { type: 'number' }, depth: { type: 'number' }, height: { type: 'number' } } },
          material: { type: 'string' },
          color: { type: 'string' },
          productId: { type: 'string' },
          productUrl: { type: 'string' },
          price: { type: 'number' },
          isPlaceholder: { type: 'boolean', default: false },
        },
      },
    },
    theme: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        colorPalette: { type: 'array', items: { type: 'string' } },
        materials: { type: 'array', items: { type: 'string' } },
        lighting: { type: 'string' },
      },
    },
    metadata: {
      type: 'object',
      required: ['createdAt', 'updatedAt', 'version'],
      properties: {
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        version: { type: 'integer', minimum: 1 },
        status: { type: 'string', enum: ['draft', 'processing', 'ready', 'rendered'] },
        originalImageKey: { type: 'string' },
        renderImageKey: { type: 'string' },
      },
    },
  },
} as const;

// TypeScript types derived from the schema
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: 'sofa' | 'chair' | 'table' | 'bed' | 'storage' | 'lighting' | 'decor' | 'rug' | 'other';
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
  roomType?: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'dining_room' | 'other';
  walls?: Array<{ id: string; start: Point2D; end: Point2D; height: number; material?: string; color?: string }>;
  windows?: Array<{ id: string; wallId: string; position: Point3D; width: number; height: number }>;
  doors?: Array<{ id: string; wallId: string; position: Point3D; width: number; height: number }>;
}

export interface SceneTheme {
  name: string;
  colorPalette: string[];
  materials: string[];
  lighting: string;
}

export interface SceneMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  status: 'draft' | 'processing' | 'ready' | 'rendered';
  originalImageKey?: string;
  renderImageKey?: string;
}

export interface SceneDescriptor {
  projectId: string;
  userId: string;
  room: RoomGeometry;
  items: FurnitureItem[];
  theme?: SceneTheme;
  metadata: SceneMetadata;
}
