export type SurfaceSettings = {
  version: 1;
  base: { color: string };
  texture: { pattern: string; intensity: number; scale: number };
  lighting: { angle: number; strength: number; ambient: number; highlight: number };
  finish: { gloss: number; roughness: number; metallic: number };
};
