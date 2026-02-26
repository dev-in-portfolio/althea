<script lang="ts">
  export let frames: { id: string; orderIndex: number; title: string; body: string; imageUrl: string | null }[] = [];
  export let currentIndex = 0;
  export let onSelect: (index: number) => void;
  export let onEdit: (frameId: string) => void;
  export let onDelete: (frameId: string) => void;
  export let onDuplicate: (frameId: string) => void;
</script>

<div class="card">
  <h2>Frames</h2>
  {#if frames.length === 0}
    <p class="small">No frames yet. Add your first scene.</p>
  {:else}
    <ul>
      {#each frames as frame, idx}
        <li class:active={idx === currentIndex}>
          <button class="link" on:click={() => onSelect(idx)}>
            <strong>{frame.title || `Frame ${idx + 1}`}</strong>
            <span class="small">{frame.body.slice(0, 64)}{frame.body.length > 64 ? '…' : ''}</span>
          </button>
          <div class="actions">
            <button class="btn secondary" on:click={() => onEdit(frame.id)}>Edit</button>
            <button class="btn secondary" on:click={() => onDuplicate(frame.id)}>Duplicate</button>
            <button class="btn secondary" on:click={() => onDelete(frame.id)}>Delete</button>
          </div>
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
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: #fbf8f3;
  }
  li.active {
    border-color: var(--accent);
    box-shadow: 0 10px 20px rgba(210, 71, 47, 0.15);
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .link {
    text-align: left;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    display: grid;
    gap: 4px;
  }
</style>
