<script lang="ts">
  export let currentIndex = 0;
  export let maxIndex = 0;
  export let labels: string[] = [];
  export let onScrub: (index: number) => void;

  let timeout: number | null = null;
  let localValue = 0;

  $: localValue = currentIndex;

  function handleInput(value: number) {
    localValue = value;
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(() => onScrub(value), 30);
  }
</script>

<div class="card">
  <h3>Timeline</h3>
  <input
    type="range"
    min="0"
    max={maxIndex}
    bind:value={localValue}
    list="ticks"
    on:input={(e) => handleInput(Number((e.target as HTMLInputElement).value))}
  />
  <datalist id="ticks">
    {#each labels as label, idx}
      <option value={idx} label={label}></option>
    {/each}
  </datalist>
  <p class="small">Frame {currentIndex + 1} of {maxIndex + 1}{labels[currentIndex] ? ` — ${labels[currentIndex]}` : ''}</p>
</div>
