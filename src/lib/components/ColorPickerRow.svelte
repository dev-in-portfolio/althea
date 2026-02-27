<script lang="ts">
  export let label: string;
  export let value = '#000000';
  export let onChange: (value: string) => void;
  const inputId = `color-${Math.random().toString(36).slice(2, 8)}`;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    onChange(target.value);
  }
</script>

<div class="row">
  <label for={inputId}>{label}</label>
  <input id={inputId} type="color" bind:value={value} on:input={handleInput} />
  <input class="input" bind:value={value} on:input={handleInput} aria-labelledby={inputId} />
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
  }
  input[type='color'] {
    width: 48px;
    height: 36px;
    border: none;
    background: transparent;
  }
</style>
