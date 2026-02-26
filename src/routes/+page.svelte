<script lang="ts">
  import { onMount } from 'svelte';
  import ProjectList from '$lib/components/ProjectList.svelte';
  import ProjectCreate from '$lib/components/ProjectCreate.svelte';
  import { getUserKey } from '$lib/client/userKey';

  let projects: { id: string; title: string; createdAt: string }[] = [];
  let error = '';

  async function loadProjects() {
    error = '';
    try {
      const res = await fetch('/api/projects', {
        headers: { 'x-user-key': getUserKey() }
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Failed to load projects.';
      } else {
        projects = data.items;
      }
    } catch (err) {
      error = 'Network error.';
    }
  }

  onMount(loadProjects);
</script>

<main class="grid">
  <div class="card">
    <h1>TimeSlice</h1>
    <p class="small">Build cinematic timelines and scrub through change.</p>
    {#if error}
      <p class="small">{error}</p>
    {/if}
  </div>
  <ProjectCreate />
  <ProjectList {projects} />
</main>
