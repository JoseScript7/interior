import { describe, it, expect, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { FurnitureObject } from '../FurnitureObject';
import type { FurnitureItem } from '@/store/scene-store';

/**
 * FurnitureObject is a React Three Fiber component: it renders three.js
 * primitives (<group>, <mesh>, ...), not DOM nodes. Plain React Testing
 * Library + jsdom cannot render these, so we use @react-three/test-renderer,
 * which is the official tool for asserting against the three.js scene graph.
 */

function makeItem(overrides: Partial<FurnitureItem> = {}): FurnitureItem {
  return {
    id: 'item-1',
    name: 'Test Item',
    category: 'sofa',
    position: { x: 1, y: 0, z: 2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '',
    dimensions: { width: 2, depth: 1, height: 0.8 },
    color: '#b8a890',
    ...overrides,
  };
}

const CATEGORIES = [
  'sofa',
  'chair',
  'table',
  'bed',
  'storage',
  'lighting',
  'rug',
  'decor',
  'unknown-category',
];

describe('FurnitureObject', () => {
  it('renders a top-level group positioned at the item position', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <FurnitureObject item={makeItem()} isSelected={false} onSelect={() => {}} />
    );

    const group = renderer.scene.children[0];
    expect(group.type).toBe('Group');
    expect(group.instance.position.toArray()).toEqual([1, 0, 2]);
  });

  it('builds furniture from multiple meshes (not a single box)', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <FurnitureObject item={makeItem({ category: 'sofa' })} isSelected={false} onSelect={() => {}} />
    );

    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBeGreaterThan(1);
  });

  it.each(CATEGORIES)('renders the "%s" category without throwing', async (category) => {
    const renderer = await ReactThreeTestRenderer.create(
      <FurnitureObject item={makeItem({ category })} isSelected={false} onSelect={() => {}} />
    );

    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0);
  });

  it('adds a selection outline mesh when selected', async () => {
    const unselected = await ReactThreeTestRenderer.create(
      <FurnitureObject item={makeItem()} isSelected={false} onSelect={() => {}} />
    );
    const selected = await ReactThreeTestRenderer.create(
      <FurnitureObject item={makeItem()} isSelected={true} onSelect={() => {}} />
    );

    const unselectedMeshes = unselected.scene.findAllByType('Mesh').length;
    const selectedMeshes = selected.scene.findAllByType('Mesh').length;
    expect(selectedMeshes).toBe(unselectedMeshes + 1);
  });

  it('renders a point light for the lighting category', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <FurnitureObject item={makeItem({ category: 'lighting' })} isSelected={false} onSelect={() => {}} />
    );

    expect(renderer.scene.findAllByType('PointLight').length).toBe(1);
  });

  it('calls onSelect when the group is clicked', async () => {
    const onSelect = vi.fn();
    const renderer = await ReactThreeTestRenderer.create(
      <FurnitureObject item={makeItem()} isSelected={false} onSelect={onSelect} />
    );

    const group = renderer.scene.children[0];
    await renderer.fireEvent(group, 'click');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('falls back to default dimensions and color when not provided', async () => {
    const item = makeItem({ dimensions: undefined, color: undefined });
    const renderer = await ReactThreeTestRenderer.create(
      <FurnitureObject item={item} isSelected={false} onSelect={() => {}} />
    );

    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0);
  });
});
