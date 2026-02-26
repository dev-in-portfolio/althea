<script lang="ts">
  import type { SurfaceSettings } from '$lib/presets/types';
  import { cssRecipe } from '$lib/render/cssRecipe';

  export let recipe: { id: string; name: string; settings: SurfaceSettings };
  export let onOpen: (id: string) => void;
  export let onDuplicate: (id: string) => void;
  export let onDelete: (id: string) => void;
</script>

<div class="card recipe-card">
  <div class="preview" style={cssRecipe(recipe.settings).style}></div>
  <div>
    <h3>{recipe.name}</h3>
    <div class="toolbar">
      <button class="btn" on:click={() => onOpen(recipe.id)}>Open</button>
      <button class="btn secondary" on:click={() => onDuplicate(recipe.id)}>Duplicate</button>
      <button class="btn secondary" on:click={() => onDelete(recipe.id)}>Delete</button>
    </div>
  </div>
</div>
