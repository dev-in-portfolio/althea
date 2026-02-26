import type { SurfaceSettings } from '$lib/presets/types';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function validateName(name: string) {
  if (!name || name.trim().length < 1 || name.trim().length > 80) {
    return 'Name must be 1-80 characters.';
  }
  return null;
}

export function validateSettings(settings: SurfaceSettings) {
  if (!settings || settings.version !== 1) return 'Invalid version.';
  if (!HEX_RE.test(settings.base.color)) return 'Invalid base color.';

  if (!['noise', 'linen', 'carbon', 'brushed', 'speckle'].includes(settings.texture.pattern)) {
    return 'Invalid texture pattern.';
  }

  if (!inRange(settings.texture.intensity, 0, 1)) return 'Invalid texture intensity.';
  if (!inRange(settings.texture.scale, 0.25, 4)) return 'Invalid texture scale.';

  if (!inRange(settings.lighting.angle, 0, 360)) return 'Invalid lighting angle.';
  if (!inRange(settings.lighting.strength, 0, 1)) return 'Invalid lighting strength.';
  if (!inRange(settings.lighting.ambient, 0, 1)) return 'Invalid lighting ambient.';

  if (!inRange(settings.finish.gloss, 0, 1)) return 'Invalid finish gloss.';
  if (!inRange(settings.finish.roughness, 0, 1)) return 'Invalid finish roughness.';
  if (!inRange(settings.finish.metallic, 0, 1)) return 'Invalid finish metallic.';

  return null;
}

function inRange(value: number, min: number, max: number) {
  return typeof value === 'number' && value >= min && value <= max;
}
