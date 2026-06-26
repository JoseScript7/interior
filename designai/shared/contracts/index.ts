/**
 * Contract loader — single source of truth for both stacks.
 * Frontend: import these JSON schemas into ajv.
 * Backend: load the same JSON files into Pydantic (see shared/contracts/loader.py).
 *
 * NOTE: schemas are stored without the `$schema` meta-key (tooling constraint).
 * `withDialect()` re-attaches the draft-07 dialect at runtime for ajv.
 */
import sceneDescriptor from './json/scene-descriptor.json';
import restApi from './json/rest-api.json';
import furnitureCatalog from './json/furniture-catalog.json';
import wsMessages from './websocket/messages.json';

const DRAFT_07 = 'http://json-schema.org/draft-07/schema#';

export function withDialect<T extends Record<string, unknown>>(schema: T): T & { $schema: string } {
  const { _meta, ...rest } = schema as Record<string, unknown>;
  return { $schema: DRAFT_07, ...(rest as T) } as T & { $schema: string };
}

export const schemas = {
  sceneDescriptor: withDialect(sceneDescriptor as Record<string, unknown>),
  restApi: withDialect(restApi as Record<string, unknown>),
  furnitureCatalog: withDialect(furnitureCatalog as Record<string, unknown>),
  wsMessages: withDialect(wsMessages as Record<string, unknown>),
};

// Re-export TypeScript types (hand-authored mirrors of the JSON schemas)
export * from './scene-descriptor.schema';
export * from './project.schema';
export * from './furniture-catalog.schema';
