'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
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

  return (
    <div className="h-full w-full">
      <Canvas shadows onPointerMissed={() => selectItem(null)}>
        <CameraRig view={view} zoom={zoom} />
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
          cellSize={0.5} cellThickness={0.6} cellColor="#dfe5ec"
          sectionSize={1} sectionThickness={1} sectionColor="#c2cad6"
          fadeDistance={26} infiniteGrid position={[0, 0, 0]}
        />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.005, 0]}>
          <planeGeometry args={[scene.room.width, scene.room.length]} />
          <meshStandardMaterial color="#f7f4ef" />
        </mesh>

        <RoomWalls room={scene.room} hide={view === '2d'} />

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
