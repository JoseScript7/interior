/**
 * Local furniture catalog — works with ZERO backend.
 * Mirrors seed/products.json so the 3D editor is fully functional offline.
 * Dimensions are in cm; the editor converts to metres.
 */
export interface CatalogItem {
  productId: string;
  name: string;
  category: 'sofa' | 'chair' | 'table' | 'bed' | 'storage' | 'lighting' | 'rug' | 'decor';
  style: string;
  material: string;
  color: string;       // hex used for the placeholder mesh + swatch
  price: number;
  dimensions: { width: number; depth: number; height: number }; // cm
  productUrl: string;
}

export const CATALOG: CatalogItem[] = [
  { productId: 'sofa-001', name: 'Scandinavian Oak Sofa', category: 'sofa', style: 'scandinavian', material: 'oak, linen', color: '#d8c3a5', price: 899, dimensions: { width: 200, depth: 85, height: 80 }, productUrl: 'https://amazon.com/s?k=scandinavian+oak+sofa' },
  { productId: 'sofa-002', name: 'Mid-Century Velvet Sofa', category: 'sofa', style: 'mid-century', material: 'velvet, walnut', color: '#2f6b54', price: 1199, dimensions: { width: 210, depth: 90, height: 82 }, productUrl: 'https://amazon.com/s?k=mid+century+velvet+sofa' },
  { productId: 'chair-001', name: 'Japandi Accent Chair', category: 'chair', style: 'japandi', material: 'rattan, teak', color: '#c9a66b', price: 499, dimensions: { width: 65, depth: 70, height: 85 }, productUrl: 'https://amazon.com/s?k=japandi+accent+chair' },
  { productId: 'chair-002', name: 'Industrial Dining Chair', category: 'chair', style: 'industrial', material: 'steel', color: '#3a3a3a', price: 149, dimensions: { width: 45, depth: 50, height: 90 }, productUrl: 'https://amazon.com/s?k=industrial+metal+dining+chair' },
  { productId: 'table-001', name: 'Walnut Coffee Table', category: 'table', style: 'minimalist', material: 'walnut', color: '#5c4033', price: 349, dimensions: { width: 120, depth: 60, height: 45 }, productUrl: 'https://amazon.com/s?k=walnut+coffee+table' },
  { productId: 'table-002', name: 'Round Marble Dining Table', category: 'table', style: 'modern', material: 'marble, brass', color: '#ece9e4', price: 1299, dimensions: { width: 120, depth: 120, height: 75 }, productUrl: 'https://amazon.com/s?k=round+marble+dining+table' },
  { productId: 'bed-001', name: 'Upholstered Platform Bed', category: 'bed', style: 'contemporary', material: 'linen', color: '#9aa0a6', price: 799, dimensions: { width: 160, depth: 210, height: 100 }, productUrl: 'https://amazon.com/s?k=upholstered+platform+bed' },
  { productId: 'storage-001', name: 'Oak Bookshelf', category: 'storage', style: 'scandinavian', material: 'oak', color: '#c9a66b', price: 429, dimensions: { width: 90, depth: 30, height: 180 }, productUrl: 'https://amazon.com/s?k=oak+bookshelf' },
  { productId: 'light-001', name: 'Brass Pendant Light', category: 'lighting', style: 'modern', material: 'brass', color: '#c9a227', price: 199, dimensions: { width: 30, depth: 30, height: 40 }, productUrl: 'https://amazon.com/s?k=brass+pendant+light' },
  { productId: 'light-002', name: 'Arc Floor Lamp', category: 'lighting', style: 'mid-century', material: 'steel, marble', color: '#2b2b2b', price: 259, dimensions: { width: 150, depth: 40, height: 200 }, productUrl: 'https://amazon.com/s?k=arc+floor+lamp' },
  { productId: 'rug-001', name: 'Moroccan Wool Rug', category: 'rug', style: 'bohemian', material: 'wool', color: '#c97b5a', price: 279, dimensions: { width: 200, depth: 150, height: 2 }, productUrl: 'https://amazon.com/s?k=moroccan+wool+rug' },
  { productId: 'decor-001', name: 'Ceramic Vase Set', category: 'decor', style: 'minimalist', material: 'ceramic', color: '#eceae5', price: 89, dimensions: { width: 20, depth: 20, height: 35 }, productUrl: 'https://amazon.com/s?k=ceramic+vase+set' },
];

export const CATEGORIES = ['all', 'sofa', 'chair', 'table', 'bed', 'storage', 'lighting', 'rug', 'decor'] as const;

/** Sample AI recommendations used in offline/demo mode (no Bedrock call). */
export const DEMO_RECOMMENDATIONS = [
  {
    theme: 'Warm Scandinavian',
    type: 'closest_to_inspiration',
    description: 'Light oak tones, soft linen textures, and an airy, uncluttered layout that maximizes natural light.',
    colorScheme: ['#d8c3a5', '#f2ede4', '#8a7a66'],
    suggestedMaterials: ['oak', 'linen', 'wool'],
    estimatedCost: 2100,
    reasoning: 'Matches the room’s bright exposure and keeps sightlines open.',
  },
  {
    theme: 'Budget Japandi',
    type: 'budget_optimized',
    description: 'Japandi calm at ~30% lower cost — rattan and teak accents over a neutral base.',
    colorScheme: ['#c9a66b', '#ece9e4', '#3a3a3a'],
    suggestedMaterials: ['rattan', 'teak', 'cotton'],
    estimatedCost: 1450,
    reasoning: 'Reuses existing neutral walls; spends only on a few statement pieces.',
  },
  {
    theme: 'Bold Mid-Century',
    type: 'creative_reinterpretation',
    description: 'A confident reinterpretation: emerald velvet, walnut, and brass for a richer, design-forward look.',
    colorScheme: ['#2f6b54', '#5c4033', '#c9a227'],
    suggestedMaterials: ['velvet', 'walnut', 'brass'],
    estimatedCost: 2850,
    reasoning: 'Introduces a focal colour and warm metals for contrast against the floor.',
  },
];
