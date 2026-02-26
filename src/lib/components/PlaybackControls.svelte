<script lang="ts">
  export let playing = false;
  export let speed = 1;
  export let onToggle: () => void;
  export let onSpeed: (value: number) => void;
  export let onPrev: () => void;
  export let onNext: () => void;
</script>

<div class="card">
  <h3>Playback</h3>
  <div class="toolbar">
    <button class="btn secondary" on:click={onPrev}>Prev</button>
    <button class="btn" on:click={onToggle}>{playing ? 'Pause' : 'Play'}</button>
    <button class="btn secondary" on:click={onNext}>Next</button>
    <select class="input" bind:value={speed} on:change={(e) => onSpeed(Number((e.target as HTMLSelectElement).value))}>
      <option value="0.5">0.5x</option>
      <option value="1">1x</option>
      <option value="2">2x</option>
    </select>
  </div>
</div>
