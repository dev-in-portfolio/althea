import type { SurfaceSettings } from './types';

export function normalizeSettings(settings: SurfaceSettings): SurfaceSettings {
  return {
    version: 1,
    base: { color: settings?.base?.color ?? '#1a1a1a' },
    texture: {
      pattern: settings?.texture?.pattern ?? 'noise',
      intensity: settings?.texture?.intensity ?? 0.3,
      scale: settings?.texture?.scale ?? 1
    },
    lighting: {
      angle: settings?.lighting?.angle ?? 45,
      strength: settings?.lighting?.strength ?? 0.5,
      ambient: settings?.lighting?.ambient ?? 0.3,
      highlight: settings?.lighting?.highlight ?? settings?.lighting?.strength ?? 0.5
    },
    finish: {
      gloss: settings?.finish?.gloss ?? 0.5,
      roughness: settings?.finish?.roughness ?? 0.4,
      metallic: settings?.finish?.metallic ?? 0.1
    }
  };
}
