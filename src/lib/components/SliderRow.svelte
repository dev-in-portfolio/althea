<script lang="ts">
  export let label: string;
  export let value = 0;
  export let min = 0;
  export let max = 1;
  export let step = 0.01;
  export let onChange: (value: number) => void;
</script>

<div class="row">
  <label>{label}</label>
  <input type="range" min={min} max={max} step={step} bind:value={value} on:input={(e) => onChange(Number((e.target as HTMLInputElement).value))} />
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
