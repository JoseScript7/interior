/**
 * Project Schema - DynamoDB record structure
 */

export interface RoomAnalysis {
  roomType: string;
  estimatedDimensions: { width: number; length: number; height: number };
  currentStyle: string;
  lightingQuality: string;
  detectedObjects: string[];
  colorPalette: string[];
}

export interface DesignRecommendation {
  theme: string;
  description: string;
  colorScheme: string[];
  suggestedMaterials: string[];
  estimatedCost: number;
  reasoning: string;
}

export type ProjectStatus =
  | 'created'
  | 'uploading'
  | 'analyzing'
  | 'recommendations_ready'
  | 'editing'
  | 'rendering'
  | 'completed';

export interface Project {
  projectId: string;
  userId: string;
  title?: string;
  status: ProjectStatus;
  roomType?: string;
  budget?: number;
  style?: string;
  originalImageKey?: string;
  inspirationImageKeys?: string[];
  analysis?: RoomAnalysis;
  recommendations?: DesignRecommendation[];
  sceneDescriptor?: Record<string, unknown>;
  renderKeys?: string[];
  createdAt: string;
  updatedAt?: string;
}

// DynamoDB key structure (single-table design)
export interface ProjectDynamoDBItem {
  PK: string;     // USER#<userId>
  SK: string;     // PROJECT#<projectId>
  GSI1PK: string; // STATUS#<status>
  GSI1SK: string; // <updatedAt>
  GSI2PK: string; // USER#<userId>
  GSI2SK: string; // <createdAt>
  TTL?: number;
  data: Project;
}

export function buildProjectKeys(userId: string, projectId: string, status: ProjectStatus, createdAt: string, updatedAt: string): Omit<ProjectDynamoDBItem, 'data'> {
  return {
    PK: `USER#${userId}`,
    SK: `PROJECT#${projectId}`,
    GSI1PK: `STATUS#${status}`,
    GSI1SK: updatedAt,
    GSI2PK: `USER#${userId}`,
    GSI2SK: createdAt,
  };
}
