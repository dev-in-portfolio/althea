<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserKey } from '$lib/client/userKey';
  import { copyToClipboard } from '$lib/client/clipboard';
  import { normalizeSettings } from '$lib/presets/normalize';
  import { cssRecipe } from '$lib/render/cssRecipe';
  import SurfacePreview from '$lib/components/SurfacePreview.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import RecipeHeader from '$lib/components/RecipeHeader.svelte';

  export let data: { recipeId: string };

  let recipe: { id: string; name: string; settings: any } | null = null;
  let status = '';

  async function loadRecipe() {
    const res = await fetch(`/api/recipes/${data.recipeId}`, {
      headers: { 'x-user-key': getUserKey() }
    });
    const result = await res.json();
    if (res.ok) {
      recipe = { ...result, settings: normalizeSettings(result.settings) };
    } else {
      status = result.error || 'Failed to load recipe.';
    }
  }

  async function save() {
    if (!recipe) return;
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-user-key': getUserKey()
      },
      body: JSON.stringify({ name: recipe.name, settings: recipe.settings })
    });
    const data = await res.json();
    status = res.ok ? 'Saved.' : data.error || 'Failed to save.';
  }

  async function copyJson() {
    if (!recipe) return;
    const ok = await copyToClipboard(JSON.stringify(recipe, null, 2));
    status = ok ? 'Copied.' : 'Copy failed.';
  }

  async function copyCss() {
    if (!recipe) return;
    const ok = await copyToClipboard(cssRecipe(recipe.settings).style);
    status = ok ? 'CSS copied.' : 'Copy failed.';
  }

  function downloadJson() {
    if (!recipe) return;
    const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recipe.name || 'surface'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  onMount(loadRecipe);
</script>

<main class="grid">
  <div class="card">
    <h1>Recipe</h1>
    <p class="small">Edit and save your surface.</p>
    {#if status}
      <p class="small">{status}</p>
    {/if}
  </div>

  {#if recipe}
    <RecipeHeader
      name={recipe.name}
      onName={(value) => (recipe = { ...recipe, name: value })}
      onSave={save}
      onCopy={copyJson}
      onCopyCss={copyCss}
      onDownload={downloadJson}
      onReset={loadRecipe}
    />

    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
      <ControlPanel
        settings={recipe.settings}
        onChange={(next) => (recipe = recipe ? { ...recipe, settings: next } : recipe)}
      />
      <div class="card">
        <h2>Preview</h2>
        <SurfacePreview settings={recipe.settings} />
      </div>
    </div>
  {/if}
</main>
