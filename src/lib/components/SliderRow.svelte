<script lang="ts">
  export let label: string;
  export let value = 0;
  export let min = 0;
  export let max = 1;
  export let step = 0.01;
  export let onChange: (value: number) => void;
  const inputId = `slider-${Math.random().toString(36).slice(2, 8)}`;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    onChange(Number(target.value));
  }
</script>

<div class="row">
  <label for={inputId}>{label}</label>
  <input id={inputId} type="range" min={min} max={max} step={step} bind:value={value} on:input={handleInput} />
  <span class="small">{value.toFixed(2)}</span>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 1fr 2fr 60px;
    gap: 12px;
    align-items: center;
  }
</style>
