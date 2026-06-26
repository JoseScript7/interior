# Unit of Work — Dependency Matrix & Build Sequence

| Unit | Depends on | Can start when |
|------|-----------|----------------|
| U0 | — | immediately (minute zero) |
| U1 | U0 (contracts, bootstrap) | U0 contracts frozen |
| U2 | U1 (AiStack endpoints, buckets) | AiStack deploying |
| U3 | U1, U2 (vision outputs) | U2 stubs exist |
| U4 | U1 (Api/Pipeline stacks), contracts | contracts frozen + U1 partial |
| U5 | U1 (DataStack OpenSearch), contracts | DataStack deployed |
| U6 | contracts (Q3), U4 API shape | contracts frozen |

## Build sequence
```
U0 ──► U1 ──► U2 ──► U3
        │
        ├──► U4 ──► U6
        └──► U5
```
Parallel tracks after U1: {U2→U3}, {U4→U6}, {U5}. Contracts (U0) unblock U4/U6 immediately.
