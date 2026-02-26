<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserKey } from '$lib/client/userKey';
  import RecipeCard from '$lib/components/RecipeCard.svelte';
  import { normalizeSettings } from '$lib/presets/normalize';

  let recipes: { id: string; name: string; settings: any }[] = [];
  let query = '';
  let sort = 'newest';
  let error = '';

  async function loadRecipes() {
    error = '';
    const res = await fetch('/api/recipes', {
      headers: { 'x-user-key': getUserKey() }
    });
    const data = await res.json();
    if (!res.ok) {
      error = data.error || 'Failed to load recipes.';
      return;
    }
    recipes = data.items.map((item: any) => ({
      ...item,
      settings: normalizeSettings(item.settings)
    }));
  }

  async function duplicateRecipe(id: string) {
    await fetch(`/api/recipes/${id}/duplicate`, {
      method: 'POST',
      headers: { 'x-user-key': getUserKey() }
    });
    await loadRecipes();
  }

  async function deleteRecipe(id: string) {
    await fetch(`/api/recipes/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-key': getUserKey() }
    });
    await loadRecipes();
  }

  function openRecipe(id: string) {
    window.location.href = `/surface/${id}`;
  }

  $: filtered = recipes
    .filter((recipe) => recipe.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'za') return b.name.localeCompare(a.name);
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  onMount(loadRecipes);
</script>

<main class="grid">
  <div class="card">
    <h1>Recipe Library</h1>
    <p class="small">Browse and reuse saved surfaces.</p>
    {#if error}
      <p class="small">{error}</p>
    {/if}
    <div class="toolbar">
      <input class="input" placeholder="Search" bind:value={query} />
      <select class="input" bind:value={sort}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
      </select>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
    {#each filtered as recipe}
      <RecipeCard
        {recipe}
        onOpen={openRecipe}
        onDuplicate={duplicateRecipe}
        onDelete={deleteRecipe}
      />
    {/each}
  </div>
</main>
