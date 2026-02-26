<script lang="ts">
  export let projects: { id: string; title: string; createdAt: string }[] = [];
</script>

<div class="card">
  <h2>Projects</h2>
  {#if projects.length === 0}
    <p class="small">No projects yet. Create your first timeline.</p>
  {:else}
    <ul>
      {#each projects as project}
        <li>
          <a href={`/project/${project.id}`}>{project.title}</a>
          <span class="small">{new Date(project.createdAt).toLocaleString()}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 12px;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: #f9f4ec;
  }
</style>
