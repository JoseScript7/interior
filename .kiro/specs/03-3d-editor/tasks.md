# Tasks — 3D Room Editor

- [x] 1. Zustand scene store + mutations + undo/redo + assistant dispatch
- [x] 2. `RoomEditor` R3F canvas (orbit, grid, walls, lighting)
- [x] 3. `FurnitureObject` placeholder mesh + selection/hover
- [x] 4. `FurnitureCatalogPanel` (search/filter/add)
- [x] 5. `PropertiesPanel` (color/scale/rotate/delete)
- [x] 6. `EditorToolbar` (view toggle, undo/redo, save, render, AR)
- [x] 7. `POST /scene` save + version increment
- [ ] 8. Bounding-box collision + snap-to-valid on drag release
- [ ] 9. GLB loading via drei useGLTF + `asset_ready` swap
- [ ] 10. 2D top-down floor-plan view
- [ ] 11. Component tests for editor panels
- [ ] 12. Progressive GLB loading (thumbnail/low-poly first, full GLB on select)
- [ ] 13. `Box3.setFromObject()` after every transform incl. rotation (collision correctness)
- [ ] 14. Dispose geometry/material/textures on item removal (prevent memory leak → tab crash)
- [ ] 15. Perf: frustum culling, instanced meshes, Suspense + low-poly placeholders (60fps target; 30fps realistic)
- [ ] 16. Metric scale: apply `metric_scale.py` factor so furniture renders at correct real-world size
- [ ] 17. AR lighting: PMREMGenerator env map from room photo (avoid synthetic-looking placement)
