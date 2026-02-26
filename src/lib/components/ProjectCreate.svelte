<script lang="ts">
  import { getUserKey } from '$lib/client/userKey';
  import { goto } from '$app/navigation';

  let title = '';
  let error = '';
  let loading = false;

  async function createProject() {
    error = '';
    if (!title.trim()) {
      error = 'Title is required.';
      return;
    }
    loading = true;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-key': getUserKey()
        },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Failed to create project.';
      } else {
        goto(`/project/${data.id}`);
      }
    } catch (err) {
      error = 'Network error.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="card">
  <h2>New Project</h2>
  <div class="grid">
    <input class="input" placeholder="Project title" bind:value={title} />
    <button class="btn" on:click={createProject} disabled={loading}>Create</button>
    {#if error}
      <p class="small">{error}</p>
    {/if}
  </div>
</div>
