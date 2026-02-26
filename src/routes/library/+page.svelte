<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserKey } from '$lib/client/userKey';
  import RecipeCard from '$lib/components/RecipeCard.svelte';

  let recipes: { id: string; name: string; settings: any }[] = [];
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
    recipes = data.items;
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

  onMount(loadRecipes);
</script>

<main class="grid">
  <div class="card">
    <h1>Recipe Library</h1>
    <p class="small">Browse and reuse saved surfaces.</p>
    {#if error}
      <p class="small">{error}</p>
    {/if}
  </div>

  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
    {#each recipes as recipe}
      <RecipeCard
        {recipe}
        onOpen={openRecipe}
        onDuplicate={duplicateRecipe}
        onDelete={deleteRecipe}
      />
    {/each}
  </div>
</main>
