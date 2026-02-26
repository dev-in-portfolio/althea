<script lang="ts">
  export let label: string;
  export let value = '#000000';
  export let onChange: (value: string) => void;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    onChange(target.value);
  }
</script>

<div class="row">
  <label>{label}</label>
  <input type="color" bind:value={value} on:input={handleInput} />
  <input class="input" bind:value={value} on:input={handleInput} />
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
