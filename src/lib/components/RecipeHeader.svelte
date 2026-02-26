<script lang="ts">
  export let name = '';
  export let onName: (value: string) => void;
  export let onSave: () => void;
  export let onCopy: () => void;
  export let onReset: () => void;
</script>

<div class="card">
  <div class="toolbar">
    <input class="input" placeholder="Recipe name" bind:value={name} on:input={(e) => onName((e.target as HTMLInputElement).value)} />
    <button class="btn" on:click={onSave}>Save</button>
    <button class="btn secondary" on:click={onCopy}>Copy JSON</button>
    <button class="btn secondary" on:click={onReset}>Reset</button>
  </div>
</div>
