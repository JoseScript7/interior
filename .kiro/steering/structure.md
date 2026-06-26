# Seeley — Directory Layout & Conventions

## Monorepo Structure (pnpm workspaces)
```
seeley/
├── frontend/          → Next.js 14 (App Router) + TypeScript
├── backend/           → Python 3.11 FastAPI (Lambda handlers)
├── infrastructure/    → AWS CDK v2 (TypeScript)
├── lambda/            → Standalone Lambda functions (pipeline stages)
├── shared/            → JSON Schema contracts + generated types
└── .kiro/             → Specs, steering, hooks
```

## Naming Conventions
- Files: kebab-case (room-editor.tsx, upload-handler.py)
- Components: PascalCase (RoomEditor, UploadWidget)
- Functions: camelCase (TypeScript), snake_case (Python)
- AWS Resources: seeley-{resource}-{env}
- CDK Constructs: PascalCase (StorageStack, AiStack)

## Frontend Organization
- app/ → Next.js App Router pages
- components/ → Domain-grouped React components
- lib/ → Utilities, SDK wrappers, integrations

## Backend Organization
- api/ → FastAPI route handlers (one file per domain)
- models/ → Pydantic schemas
- services/ → Business logic + AWS SDK wrappers

## Shared Contracts
- shared/contracts/*.json → JSON Schema (draft-07) source of truth
- shared/types/ → Generated TypeScript types (from JSON Schema)
- shared/python/ → Generated Pydantic models (from JSON Schema)
