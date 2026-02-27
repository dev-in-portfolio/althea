<script lang="ts">
  export let frames: { id: string; title: string; body: string; imageUrl: string | null }[] = [];
  export let aIndex = 0;
  export let bIndex = 0;
  export let onChangeA: (index: number) => void;
  export let onChangeB: (index: number) => void;
  export let overlay = false;
  export let mix = 50;
  export let onMix: (value: number) => void;
  export let onSyncA: () => void;
  export let onSyncB: () => void;

  function handleMixInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    onMix(Number(target.value));
  }

  function handleAChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;
    onChangeA(Number(target.value));
  }

  function handleBChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;
    onChangeB(Number(target.value));
  }
</script>

<div class="card">
  <h3>Compare</h3>
  <div class="toolbar">
    <button class="btn secondary" on:click={onSyncA}>A = current</button>
    <button class="btn secondary" on:click={onSyncB}>B = current</button>
  </div>
  {#if overlay}
    <div class="overlay">
      {#if frames[aIndex]?.imageUrl || frames[bIndex]?.imageUrl}
        <div class="overlay-frame">
          {#if frames[aIndex]?.imageUrl}
            <img class="frame-image" src={frames[aIndex].imageUrl} alt="Frame A" style={`opacity:${(100 - mix) / 100}`} loading="lazy" decoding="async" />
          {/if}
          {#if frames[bIndex]?.imageUrl}
            <img class="frame-image overlay-top" src={frames[bIndex].imageUrl} alt="Frame B" style={`opacity:${mix / 100}`} loading="lazy" decoding="async" />
          {/if}
        </div>
      {/if}
      <input type="range" min="0" max="100" bind:value={mix} on:input={handleMixInput} />
    </div>
  {/if}
  {#if overlay}
    <div class="overlay">
      <input type="range" min="0" max="100" bind:value={mix} on:input={handleMixInput} />
      <div class="overlay-frame">
        {#if frames[aIndex]?.imageUrl || frames[bIndex]?.imageUrl}
          {#if frames[aIndex]?.imageUrl}
            <img class="frame-image" src={frames[aIndex].imageUrl} alt="Frame A" style={`opacity:${(100 - mix) / 100}`} loading="lazy" decoding="async" />
          {/if}
          {#if frames[bIndex]?.imageUrl}
            <img class="frame-image overlay-top" src={frames[bIndex].imageUrl} alt="Frame B" style={`opacity:${mix / 100}`} loading="lazy" decoding="async" />
          {/if}
        {:else}
          <p class="small">Overlay is image-only. No images for selected frames.</p>
        {/if}
      </div>
    </div>
  {/if}
  <div class="grid compare">
    <div>
      <label class="small" for="frame-a-select">Frame A</label>
      <select id="frame-a-select" class="input" bind:value={aIndex} on:change={handleAChange}>
        {#each frames as frame, idx}
          <option value={idx}>{frame.title || `Frame ${idx + 1}`}</option>
        {/each}
      </select>
      {#if frames[aIndex]}
        <div class="frame-view">
          <h4>{frames[aIndex].title}</h4>
          <p>{frames[aIndex].body}</p>
          {#if frames[aIndex].imageUrl}
            <img class="frame-image" src={frames[aIndex].imageUrl} alt="Frame A" loading="lazy" decoding="async" />
          {/if}
        </div>
      {/if}
    </div>
    <div>
      <label class="small" for="frame-b-select">Frame B</label>
      <select id="frame-b-select" class="input" bind:value={bIndex} on:change={handleBChange}>
        {#each frames as frame, idx}
          <option value={idx}>{frame.title || `Frame ${idx + 1}`}</option>
        {/each}
      </select>
      {#if frames[bIndex]}
        <div class="frame-view">
          <h4>{frames[bIndex].title}</h4>
          <p>{frames[bIndex].body}</p>
          {#if frames[bIndex].imageUrl}
            <img class="frame-image" src={frames[bIndex].imageUrl} alt="Frame B" loading="lazy" decoding="async" />
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
  .overlay-frame {
    position: relative;
    min-height: 200px;
  }
  .overlay-top {
    position: absolute;
    inset: 0;
  }
</style>
