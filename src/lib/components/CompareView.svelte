<script lang="ts">
  export let frames: { id: string; title: string; body: string; imageUrl: string | null }[] = [];
  export let aIndex = 0;
  export let bIndex = 0;
  export let onChangeA: (index: number) => void;
  export let onChangeB: (index: number) => void;
</script>

<div class="card">
  <h3>Compare</h3>
  <div class="grid compare">
    <div>
      <label class="small">Frame A</label>
      <select class="input" bind:value={aIndex} on:change={(e) => onChangeA(Number((e.target as HTMLSelectElement).value))}>
        {#each frames as frame, idx}
          <option value={idx}>{frame.title || `Frame ${idx + 1}`}</option>
        {/each}
      </select>
      {#if frames[aIndex]}
        <div class="frame-view">
          <h4>{frames[aIndex].title}</h4>
          <p>{frames[aIndex].body}</p>
          {#if frames[aIndex].imageUrl}
            <img class="frame-image" src={frames[aIndex].imageUrl} alt="Frame A" />
          {/if}
        </div>
      {/if}
    </div>
    <div>
      <label class="small">Frame B</label>
      <select class="input" bind:value={bIndex} on:change={(e) => onChangeB(Number((e.target as HTMLSelectElement).value))}>
        {#each frames as frame, idx}
          <option value={idx}>{frame.title || `Frame ${idx + 1}`}</option>
        {/each}
      </select>
      {#if frames[bIndex]}
        <div class="frame-view">
          <h4>{frames[bIndex].title}</h4>
          <p>{frames[bIndex].body}</p>
          {#if frames[bIndex].imageUrl}
            <img class="frame-image" src={frames[bIndex].imageUrl} alt="Frame B" />
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .compare {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
</style>
