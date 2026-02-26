<script lang="ts">
  export let value = 'Build';
  export let onChange: (value: string) => void;
  export let suggestions: string[] = [];

  const presets = ['Build', 'Study', 'Ops', 'Creative', 'Deep Work', 'Review'];

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement | HTMLInputElement | null;
    if (!target) return;
    onChange(target.value);
  }
</script>

<div class="grid" style="gap: 12px;">
  <label class="muted" for="tag-select">Tag</label>
  <select id="tag-select" class="input" bind:value={value} on:change={handleChange}>
    {#each presets as tag}
      <option value={tag}>{tag}</option>
    {/each}
  </select>
  <label class="muted" for="tag-custom">Custom tag</label>
  <input id="tag-custom" class="input" value={value} placeholder="Custom tag" on:input={handleChange} />
  {#if suggestions.length}
    <div class="toolbar">
      <span class="muted">Recent:</span>
      {#each suggestions as suggestion}
        <button class="btn secondary" on:click={() => onChange(suggestion)}>{suggestion}</button>
      {/each}
    </div>
  {/if}
</div>
