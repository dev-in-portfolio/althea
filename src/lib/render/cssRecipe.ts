import type { SurfaceSettings } from '$lib/presets/types';

export function cssRecipe(settings: SurfaceSettings) {
  const base = settings.base.color;
  const { pattern, intensity, scale } = settings.texture;
  const { angle, strength, ambient, highlight } = settings.lighting;
  const { gloss, roughness, metallic } = settings.finish;

  const lighting = `linear-gradient(${angle}deg, rgba(255,255,255,${strength}), rgba(0,0,0,${ambient}))`;
  const sheen = `radial-gradient(circle at 30% 20%, rgba(255,255,255,${(highlight ?? strength) * 0.6}), rgba(255,255,255,0) 55%)`;
  const contrast = `linear-gradient(180deg, rgba(255,255,255,${0.15 * metallic}), rgba(0,0,0,${roughness * 0.4}))`;
  const vignette = `radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)`;

  const textureLayer = {
    noise: `radial-gradient(rgba(255,255,255,${0.18 * intensity}) 1px, transparent 1px)` +
      ` 0 0 / ${4 * scale}px ${4 * scale}px`,
    linen: `repeating-linear-gradient(45deg, rgba(255,255,255,${0.08 * intensity}) 0 2px, transparent 2px 6px),` +
      `repeating-linear-gradient(-45deg, rgba(0,0,0,${0.08 * intensity}) 0 2px, transparent 2px 6px)`,
    carbon: `repeating-linear-gradient(45deg, rgba(255,255,255,${0.15 * intensity}) 0 6px, transparent 6px 12px),` +
      `repeating-linear-gradient(-45deg, rgba(0,0,0,${0.2 * intensity}) 0 6px, transparent 6px 12px)`,
    brushed: `repeating-linear-gradient(90deg, rgba(255,255,255,${0.12 * intensity}) 0 1px, transparent 1px 3px)`,
    speckle: `radial-gradient(rgba(255,255,255,${0.22 * intensity}) 1px, transparent 3px)` +
      ` 0 0 / ${10 * scale}px ${10 * scale}px`
  }[pattern] || '';

  const background = [
    sheen,
    lighting,
    contrast,
    vignette,
    textureLayer,
    `linear-gradient(135deg, ${base}, ${base})`
  ].filter(Boolean).join(', ');

  return {
    style: `background:${background}; box-shadow: inset 0 0 60px rgba(0,0,0,${0.2 + roughness * 0.4}), 0 16px 40px rgba(0,0,0,0.4);`
  };
}
