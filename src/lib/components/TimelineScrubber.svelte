<script lang="ts">
  export let currentIndex = 0;
  export let maxIndex = 0;
  export let onScrub: (index: number) => void;
</script>

<div class="card">
  <h3>Timeline</h3>
  <input
    type="range"
    min="0"
    max={maxIndex}
    bind:value={currentIndex}
    on:input={(e) => onScrub(Number((e.target as HTMLInputElement).value))}
  />
  <p class="small">Frame {currentIndex + 1} of {maxIndex + 1}</p>
</div>
