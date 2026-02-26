<script lang="ts">
  import type { SurfaceSettings } from '$lib/presets/types';

  export let presets: { name: string; settings: SurfaceSettings }[] = [];
  export let onSelect: (preset: { name: string; settings: SurfaceSettings }) => void;
</script>

<div class="card">
  <h2>Presets</h2>
  <div class="toolbar">
    {#each presets as preset}
      <button class="btn secondary" on:click={() => onSelect(preset)}>{preset.name}</button>
    {/each}
  </div>
</div>
