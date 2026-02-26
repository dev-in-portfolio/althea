<script lang="ts">
  import type { SurfaceSettings } from '$lib/presets/types';
  import { cssRecipe } from '$lib/render/cssRecipe';

  export let presets: { name: string; settings: SurfaceSettings }[] = [];
  export let onSelect: (preset: { name: string; settings: SurfaceSettings }) => void;
</script>

<div class="card">
  <h2>Presets</h2>
  <div class="toolbar">
    {#each presets as preset}
      <button class="btn secondary" on:click={() => onSelect(preset)}>
        <span class="swatch" style={cssRecipe(preset.settings).style}></span>
        {preset.name}
      </button>
    {/each}
  </div>
</div>

<style>
  .swatch {
    width: 22px;
    height: 22px;
    border-radius: 8px;
    display: inline-block;
    margin-right: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
</style>
