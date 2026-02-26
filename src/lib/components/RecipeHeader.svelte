<script lang="ts">
  export let name = '';
  export let onName: (value: string) => void;
  export let onSave: () => void;
  export let onCopy: () => void;
  export let onCopyCss: () => void;
  export let onDownload: () => void;
  export let onReset: () => void;

  function handleNameInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    onName(target.value);
  }
</script>

<div class="card">
  <div class="toolbar">
    <input class="input" placeholder="Recipe name" bind:value={name} on:input={handleNameInput} />
    <button class="btn" on:click={onSave}>Save</button>
    <button class="btn secondary" on:click={onCopy}>Copy JSON</button>
    <button class="btn secondary" on:click={onCopyCss}>Copy CSS</button>
    <button class="btn secondary" on:click={onDownload}>Download JSON</button>
    <button class="btn secondary" on:click={onReset}>Reset</button>
  </div>
</div>
