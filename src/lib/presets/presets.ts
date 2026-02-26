import type { SurfaceSettings } from './types';

export const presets: { name: string; settings: SurfaceSettings }[] = [
  {
    name: 'Brushed Steel',
    settings: {
      version: 1,
      base: { color: '#45464a' },
      texture: { pattern: 'brushed', intensity: 0.35, scale: 1.6 },
      lighting: { angle: 25, strength: 0.65, ambient: 0.25 },
      finish: { gloss: 0.55, roughness: 0.35, metallic: 0.4 }
    }
  },
  {
    name: 'Ceramic Glaze',
    settings: {
      version: 1,
      base: { color: '#f1e6d6' },
      texture: { pattern: 'speckle', intensity: 0.4, scale: 1.3 },
      lighting: { angle: 60, strength: 0.5, ambient: 0.35 },
      finish: { gloss: 0.7, roughness: 0.2, metallic: 0.1 }
    }
  },
  {
    name: 'Carbon Fiber',
    settings: {
      version: 1,
      base: { color: '#1a1a1a' },
      texture: { pattern: 'carbon', intensity: 0.6, scale: 1.4 },
      lighting: { angle: 35, strength: 0.55, ambient: 0.2 },
      finish: { gloss: 0.4, roughness: 0.6, metallic: 0.2 }
    }
  },
  {
    name: 'Matte Polymer',
    settings: {
      version: 1,
      base: { color: '#2a2f36' },
      texture: { pattern: 'linen', intensity: 0.25, scale: 1.2 },
      lighting: { angle: 45, strength: 0.35, ambient: 0.4 },
      finish: { gloss: 0.2, roughness: 0.7, metallic: 0.05 }
    }
  },
  {
    name: 'Neon Acrylic',
    settings: {
      version: 1,
      base: { color: '#ff4fd8' },
      texture: { pattern: 'noise', intensity: 0.2, scale: 1.0 },
      lighting: { angle: 90, strength: 0.7, ambient: 0.3 },
      finish: { gloss: 0.8, roughness: 0.2, metallic: 0.05 }
    }
  }
];
