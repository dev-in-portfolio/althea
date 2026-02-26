<script lang="ts">
  export let frames: { id: string; title: string }[] = [];
  export let onReorder: (order: string[]) => void;

  let positions: Record<string, number> = {};

  $: positions = Object.fromEntries(frames.map((frame, idx) => [frame.id, idx + 1]));

  function moveUp(idx: number) {
    if (idx === 0) return;
    const order = frames.map((frame) => frame.id);
    [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
    onReorder(order);
  }

  function moveDown(idx: number) {
    if (idx === frames.length - 1) return;
    const order = frames.map((frame) => frame.id);
    [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
    onReorder(order);
  }

  function moveTo(frameId: string) {
    const order = frames.map((frame) => frame.id);
    const idx = order.indexOf(frameId);
    const target = Math.max(1, Math.min(frames.length, positions[frameId] || 1)) - 1;
    order.splice(idx, 1);
    order.splice(target, 0, frameId);
    onReorder(order);
  }
</script>

<div class="card">
  <h2>Reorder</h2>
  {#if frames.length === 0}
    <p class="small">No frames to reorder.</p>
  {:else}
    <ul>
      {#each frames as frame, idx}
        <li>
          <span>{frame.title || `Frame ${idx + 1}`}</span>
          <div class="actions">
            <button class="btn secondary" on:click={() => moveUp(idx)}>Up</button>
            <button class="btn secondary" on:click={() => moveDown(idx)}>Down</button>
            <input class="input" type="number" min="1" max={frames.length} bind:value={positions[frame.id]} />
            <button class="btn secondary" on:click={() => moveTo(frame.id)}>Move</button>
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
    border-radius: 12px;
    border: 1px solid var(--border);
    background: #f7f2ea;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  input {
    max-width: 80px;
  }
</style>
