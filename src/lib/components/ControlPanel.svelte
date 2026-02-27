<script lang="ts">
  import type { SurfaceSettings } from '$lib/presets/types';
  import SliderRow from './SliderRow.svelte';
  import ColorPickerRow from './ColorPickerRow.svelte';

  export let settings: SurfaceSettings;
  export let onChange: (settings: SurfaceSettings) => void;

  const patterns = ['noise', 'linen', 'carbon', 'brushed', 'speckle'];
  const hexRe = /^#[0-9a-fA-F]{6}$/;

  $: colorError = hexRe.test(settings.base.color) ? '' : 'Invalid hex color.';

  function update(partial: Partial<SurfaceSettings>) {
    onChange({
      ...settings,
      ...partial,
      base: { ...settings.base, ...(partial.base || {}) },
      texture: { ...settings.texture, ...(partial.texture || {}) },
      lighting: { ...settings.lighting, ...(partial.lighting || {}) },
      finish: { ...settings.finish, ...(partial.finish || {}) }
    });
  }

  function handlePatternChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;
    update({ texture: { pattern: target.value } });
  }
</script>

<div class="card">
  <h2>Surface Controls</h2>
  <div class="grid">
    {#if colorError}
      <p class="small">{colorError}</p>
    {/if}
    <ColorPickerRow
      label="Base Color"
      value={settings.base.color}
      onChange={(value) => update({ base: { color: value } })}
    />

    <div>
      <label class="small" for="texture-pattern">Texture Pattern</label>
      <select id="texture-pattern" class="input" bind:value={settings.texture.pattern} on:change={handlePatternChange}>
        {#each patterns as pattern}
          <option value={pattern}>{pattern}</option>
        {/each}
      </select>
    </div>

    <SliderRow label="Texture Intensity" value={settings.texture.intensity} min={0} max={1} step={0.01} onChange={(value) => update({ texture: { intensity: value } })} />
    <SliderRow label="Texture Scale" value={settings.texture.scale} min={0.25} max={4} step={0.01} onChange={(value) => update({ texture: { scale: value } })} />

    <SliderRow label="Light Angle" value={settings.lighting.angle} min={0} max={360} step={1} onChange={(value) => update({ lighting: { angle: value } })} />
    <SliderRow label="Light Strength" value={settings.lighting.strength} min={0} max={1} step={0.01} onChange={(value) => update({ lighting: { strength: value } })} />
    <SliderRow label="Highlight Strength" value={settings.lighting.highlight} min={0} max={1} step={0.01} onChange={(value) => update({ lighting: { highlight: value } })} />
    <SliderRow label="Ambient" value={settings.lighting.ambient} min={0} max={1} step={0.01} onChange={(value) => update({ lighting: { ambient: value } })} />

    <SliderRow label="Gloss" value={settings.finish.gloss} min={0} max={1} step={0.01} onChange={(value) => update({ finish: { gloss: value } })} />
    <SliderRow label="Roughness" value={settings.finish.roughness} min={0} max={1} step={0.01} onChange={(value) => update({ finish: { roughness: value } })} />
    <SliderRow label="Metallic" value={settings.finish.metallic} min={0} max={1} step={0.01} onChange={(value) => update({ finish: { metallic: value } })} />
  </div>
</div>
