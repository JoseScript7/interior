'use client';

import { useState, useMemo } from 'react';
import { useCursor, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore, FurnitureItem } from '@/store/scene-store';

interface Props {
  item: FurnitureItem;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Renders recognizable furniture built from primitives (not a single box).
 * Each category composes simple meshes sized to the item's real dimensions (metres).
 * The whole group sits on the floor (y=0) and is clickable/selectable.
 */
export function FurnitureObject({ item, isSelected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);
  const setDraggingId = useSceneStore((s) => s.setDraggingId);
  useCursor(hovered);

  const d = item.dimensions || { width: 1, depth: 1, height: 1 };
  const s = item.scale || { x: 1, y: 1, z: 1 };
  const w = d.width * s.x, dp = d.depth * s.z, h = d.height * s.y;
  const base = item.color || '#b8a890';
  const dark = useMemo(() => shade(base, -0.18), [base]);
  const light = useMemo(() => shade(base, 0.12), [base]);
  const legColor = '#5a4632';

  const mat = (c: string) => <meshStandardMaterial color={c} roughness={0.7} metalness={0.05} />;

  return (
    <group
      position={[item.position.x, item.position.y, item.position.z]}
      rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerDown={(e) => { e.stopPropagation(); onSelect(); setDraggingId(item.id); }}
      onPointerUp={(e) => { e.stopPropagation(); setDraggingId(null); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {renderByCategory(item.category, { w, dp, h, base, dark, light, legColor, mat })}

      {/* selection / hover outline box */}
      {(isSelected || hovered) && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.04, h + 0.04, dp + 0.04]} />
          <meshBasicMaterial transparent opacity={0} />
          <Edges color={isSelected ? '#2196f3' : '#9bb4d0'} />
        </mesh>
      )}
    </group>
  );
}

type Ctx = { w: number; dp: number; h: number; base: string; dark: string; light: string; legColor: string; mat: (c: string) => JSX.Element };

function renderByCategory(cat: string, c: Ctx) {
  switch (cat) {
    case 'sofa': return <Sofa {...c} />;
    case 'chair': return <Chair {...c} />;
    case 'table': return <Table {...c} />;
    case 'bed': return <Bed {...c} />;
    case 'storage': return <Storage {...c} />;
    case 'lighting': return <Lamp {...c} />;
    case 'rug': return <Rug {...c} />;
    default: return <Decor {...c} />;
  }
}

function Sofa({ w, dp, h, base, dark, mat }: Ctx) {
  const seatH = h * 0.45, backH = h, armW = w * 0.12;
  return (
    <group>
      {/* base / seat block */}
      <mesh position={[0, seatH / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, seatH, dp]} />{mat(base)}</mesh>
      {/* backrest */}
      <mesh position={[0, backH * 0.55, -dp / 2 + dp * 0.12]} castShadow><boxGeometry args={[w, backH * 0.8, dp * 0.22]} />{mat(dark)}</mesh>
      {/* arms */}
      <mesh position={[-w / 2 + armW / 2, seatH * 0.85, 0]} castShadow><boxGeometry args={[armW, seatH * 1.1, dp]} />{mat(dark)}</mesh>
      <mesh position={[w / 2 - armW / 2, seatH * 0.85, 0]} castShadow><boxGeometry args={[armW, seatH * 1.1, dp]} />{mat(dark)}</mesh>
      {/* seat cushions */}
      <mesh position={[-w * 0.22, seatH + 0.04, dp * 0.05]} castShadow><boxGeometry args={[w * 0.42, 0.12, dp * 0.7]} />{mat(base)}</mesh>
      <mesh position={[w * 0.22, seatH + 0.04, dp * 0.05]} castShadow><boxGeometry args={[w * 0.42, 0.12, dp * 0.7]} />{mat(base)}</mesh>
    </group>
  );
}

function Chair({ w, dp, h, base, dark, legColor, mat }: Ctx) {
  const seatH = h * 0.5, legT = Math.min(w, dp) * 0.08;
  const lx = w / 2 - legT, lz = dp / 2 - legT;
  return (
    <group>
      <mesh position={[0, seatH, 0]} castShadow><boxGeometry args={[w, h * 0.08, dp]} />{mat(base)}</mesh>
      <mesh position={[0, seatH + h * 0.28, -dp / 2 + legT]} castShadow><boxGeometry args={[w, h * 0.5, h * 0.06]} />{mat(dark)}</mesh>
      {[[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].map(([x, z], i) => (
        <mesh key={i} position={[x, seatH / 2, z]} castShadow><boxGeometry args={[legT, seatH, legT]} />{mat(legColor)}</mesh>
      ))}
    </group>
  );
}

function Table({ w, dp, h, base, legColor, mat }: Ctx) {
  const topH = h * 0.1, legT = Math.min(w, dp) * 0.07;
  const lx = w / 2 - legT, lz = dp / 2 - legT;
  return (
    <group>
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, topH, dp]} />{mat(base)}</mesh>
      {[[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].map(([x, z], i) => (
        <mesh key={i} position={[x, (h - topH) / 2, z]} castShadow><boxGeometry args={[legT, h - topH, legT]} />{mat(legColor)}</mesh>
      ))}
    </group>
  );
}

function Bed({ w, dp, h, base, dark, mat }: Ctx) {
  const baseH = h * 0.35, mattH = h * 0.22;
  return (
    <group>
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, baseH, dp]} />{mat(dark)}</mesh>
      <mesh position={[0, baseH + mattH / 2, dp * 0.04]} castShadow><boxGeometry args={[w * 0.96, mattH, dp * 0.9]} />{mat(base)}</mesh>
      {/* headboard */}
      <mesh position={[0, h * 0.6, -dp / 2 + 0.05]} castShadow><boxGeometry args={[w, h * 0.7, 0.1]} />{mat(dark)}</mesh>
      {/* pillows */}
      <mesh position={[-w * 0.22, baseH + mattH + 0.05, -dp * 0.28]} castShadow><boxGeometry args={[w * 0.32, 0.1, dp * 0.22]} />{mat('#f5f2ec')}</mesh>
      <mesh position={[w * 0.22, baseH + mattH + 0.05, -dp * 0.28]} castShadow><boxGeometry args={[w * 0.32, 0.1, dp * 0.22]} />{mat('#f5f2ec')}</mesh>
    </group>
  );
}

function Storage({ w, dp, h, base, dark, mat }: Ctx) {
  const shelves = 4, t = 0.04;
  return (
    <group>
      <mesh position={[0, h / 2, -dp / 2 + t / 2]} castShadow><boxGeometry args={[w, h, t]} />{mat(dark)}</mesh>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow><boxGeometry args={[t, h, dp]} />{mat(base)}</mesh>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow><boxGeometry args={[t, h, dp]} />{mat(base)}</mesh>
      {Array.from({ length: shelves + 1 }).map((_, i) => (
        <mesh key={i} position={[0, (h / shelves) * i, 0]} castShadow><boxGeometry args={[w, t, dp]} />{mat(base)}</mesh>
      ))}
    </group>
  );
}

function Lamp({ w, dp, h, base, dark, mat }: Ctx) {
  const r = Math.min(w, dp) / 2;
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[r * 0.6, r * 0.7, 0.04, 24]} />{mat(dark)}</mesh>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.02, 0.02, h * 0.9, 12]} />{mat('#8a8a8a')}</mesh>
      <mesh position={[0, h - r * 0.5, 0]} castShadow><coneGeometry args={[r, r * 1.1, 24, 1, true]} />{mat(base)}</mesh>
      <pointLight position={[0, h - r * 0.5, 0]} intensity={0.4} distance={4} color="#ffe9c2" />
    </group>
  );
}

function Rug({ w, dp, base, light, mat }: Ctx) {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} receiveShadow rotation={[0, 0, 0]}><boxGeometry args={[w, 0.02, dp]} />{mat(base)}</mesh>
      <mesh position={[0, 0.021, 0]}><boxGeometry args={[w * 0.8, 0.005, dp * 0.8]} />{mat(light)}</mesh>
    </group>
  );
}

function Decor({ w, dp, h, base, mat }: Ctx) {
  const r = Math.min(w, dp) / 2;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[r * 0.7, r * 0.5, h, 20]} />{mat(base)}</mesh>
    </group>
  );
}

/** lighten (+) or darken (-) a hex color */
function shade(hex: string, amt: number): string {
  try {
    const c = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    hsl.l = Math.max(0, Math.min(1, hsl.l + amt));
    c.setHSL(hsl.h, hsl.s, hsl.l);
    return `#${c.getHexString()}`;
  } catch {
    return hex;
  }
}
