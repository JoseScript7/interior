'use client';

import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';
import { useSceneStore } from '@/store/scene-store';
import { FurnitureObject } from './FurnitureObject';

interface Props {
  view?: '2d' | '3d';
  zoom?: number;
}

export function RoomEditor({ view = '3d', zoom = 6 }: Props) {
  const scene = useSceneStore((s) => s.scene);
  const selectedItemId = useSceneStore((s) => s.selectedItemId);
  const selectItem = useSceneStore((s) => s.selectItem);

  if (!scene) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[rgb(var(--accent))]" />
      </div>
    );
  }

  const half = Math.max(scene.room.width, scene.room.length) * 3;

  return (
    <div className="h-full w-full">
      <Canvas shadows onPointerMissed={() => selectItem(null)}>
        <CameraRig view={view} zoom={zoom} />
        <ControlsToggle />
        <SceneExporter />
        <OrbitControls
          makeDefault
          enableRotate={view === '3d'}
          minDistance={2}
          maxDistance={20}
          maxPolarAngle={view === '2d' ? 0.01 : Math.PI / 2 - 0.05}
        />

        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 9, 4]} intensity={1.1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <hemisphereLight intensity={0.3} />

        <Grid
          args={[scene.room.width * 2, scene.room.length * 2]}
          cellSize={0.5} cellThickness={0.6} cellColor="#2a2f38"
          sectionSize={1} sectionThickness={1} sectionColor="#3a4150"
          fadeDistance={26} infiniteGrid position={[0, 0, 0]}
        />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.005, 0]}>
          <planeGeometry args={[scene.room.width, scene.room.length]} />
          <meshStandardMaterial color="#15171c" />
        </mesh>

        {/* Interaction plane: furniture dragging (select mode) + wall drawing (draw-wall mode) */}
        <InteractionPlane half={half} />

        {/* Default bounding walls (hidden in 2D and once the user draws their own) */}
        <RoomWalls room={scene.room} hide={view === '2d' || (scene.walls?.length ?? 0) > 0} />

        {/* User-drawn floor-plan walls */}
        <DrawnWalls />

        <Suspense fallback={null}>
          {scene.items.map((item) => (
            <FurnitureObject key={item.id} item={item} isSelected={selectedItemId === item.id} onSelect={() => selectItem(item.id)} />
          ))}
        </Suspense>

        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}

/** Disables OrbitControls while an item is being dragged. */
function ControlsToggle() {
  const draggingId = useSceneStore((s) => s.draggingId);
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null;
  useEffect(() => {
    if (controls) controls.enabled = !draggingId;
  }, [draggingId, controls]);
  return null;
}

/** Exports the current 3D scene to a downloadable .glb when requested. */
function SceneExporter() {
  const exportNonce = useSceneStore((s) => s.exportNonce);
  const sceneRef = useThree((s) => s.scene);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; } // skip initial mount
    if (!sceneRef) return;
    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seeley-room-${Date.now()}.glb`;
        a.click();
        URL.revokeObjectURL(url);
      },
      (err) => console.error('GLB export failed', err),
      { binary: true }
    );
  }, [exportNonce, sceneRef]);
  return null;
}

function CameraRig({ view, zoom }: { view: '2d' | '3d'; zoom: number }) {
  const { camera } = useThree();
  useEffect(() => {
    if (view === '2d') {
      camera.position.set(0, zoom * 1.6, 0.001);
    } else {
      camera.position.set(zoom, zoom * 0.8, zoom);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [view, zoom, camera]);
  return null;
}

function RoomWalls({ room, hide }: { room: { width: number; length: number; height: number }; hide?: boolean }) {
  if (hide) return null;
  const t = 0.08;
  const c = '#ffffff';
  return (
    <group>
      <mesh position={[0, room.height / 2, -room.length / 2]} castShadow receiveShadow>
        <boxGeometry args={[room.width, room.height, t]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[-room.width / 2, room.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, room.height, room.length]} />
        <meshStandardMaterial color={c} />
      </mesh>
    </group>
  );
}

/** Snap a floor coordinate to a 0.25 m grid for tidy wall corners. */
function snap(v: number, step = 0.25): number {
  return Math.round(v / step) * step;
}

/**
 * Single floor-level plane that captures pointer events.
 * - select mode: drags the active furniture item across the floor
 * - draw-wall mode: click to set a start corner, click again to commit a wall
 */
function InteractionPlane({ half }: { half: number }) {
  const editorMode = useSceneStore((s) => s.editorMode);
  const draggingId = useSceneStore((s) => s.draggingId);
  const setDraggingId = useSceneStore((s) => s.setDraggingId);
  const updateItemPosition = useSceneStore((s) => s.updateItemPosition);
  const draftWallStart = useSceneStore((s) => s.draftWallStart);
  const setDraftWallStart = useSceneStore((s) => s.setDraftWallStart);
  const addWall = useSceneStore((s) => s.addWall);
  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);

  const drawing = editorMode === 'draw-wall';

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        visible={false}
        onPointerDown={(e) => {
          if (!drawing) return;
          e.stopPropagation();
          const p = { x: snap(e.point.x), z: snap(e.point.z) };
          if (!draftWallStart) {
            setDraftWallStart(p);
          } else {
            addWall(draftWallStart, p);
          }
        }}
        onPointerMove={(e) => {
          if (drawing) {
            setHover({ x: snap(e.point.x), z: snap(e.point.z) });
            return;
          }
          if (!draggingId) return;
          e.stopPropagation();
          updateItemPosition(draggingId, { x: e.point.x, y: 0, z: e.point.z });
        }}
        onPointerUp={() => setDraggingId(null)}
      >
        <planeGeometry args={[half * 2, half * 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Live preview of the wall being drawn */}
      {drawing && draftWallStart && hover && (
        <WallMesh start={draftWallStart} end={hover} height={2.6} thickness={0.1} preview />
      )}
    </>
  );
}

/** Renders all committed floor-plan walls; clicking one in draw mode deletes it. */
function DrawnWalls() {
  const walls = useSceneStore((s) => s.scene?.walls ?? []);
  const editorMode = useSceneStore((s) => s.editorMode);
  const removeWall = useSceneStore((s) => s.removeWall);

  return (
    <group>
      {walls.map((w) => (
        <WallMesh
          key={w.id}
          start={w.start}
          end={w.end}
          height={w.height}
          thickness={w.thickness}
          onClick={editorMode === 'draw-wall' ? () => removeWall(w.id) : undefined}
        />
      ))}
    </group>
  );
}

/** A single wall drawn between two floor points, extruded to `height`. */
function WallMesh({
  start,
  end,
  height,
  thickness,
  preview,
  onClick,
}: {
  start: { x: number; z: number };
  end: { x: number; z: number };
  height: number;
  thickness: number;
  preview?: boolean;
  onClick?: () => void;
}) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length < 0.01) return null;
  const cx = (start.x + end.x) / 2;
  const cz = (start.z + end.z) / 2;
  const angle = Math.atan2(dz, dx);

  return (
    <mesh
      position={[cx, height / 2, cz]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
    >
      <boxGeometry args={[length, height, thickness]} />
      <meshStandardMaterial
        color={preview ? '#2196f3' : '#ffffff'}
        transparent={preview}
        opacity={preview ? 0.5 : 1}
      />
    </mesh>
  );
}
