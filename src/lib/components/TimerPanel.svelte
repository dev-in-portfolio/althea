<script lang="ts">
  import FeelToggle from './FeelToggle.svelte';
  import TagPicker from './TagPicker.svelte';

  export let running = false;
  export let elapsed = 0;
  export let tag = 'Build';
  export let feel = 0;
  export let note = '';
  export let suggestions: string[] = [];
  export let templates: { label: string; tag: string; feel: number }[] = [];
  export let onStart: () => void;
  export let onStop: () => void;
  export let onTagChange: (value: string) => void;
  export let onFeelChange: (value: number) => void;
  export let onNoteChange: (value: string) => void;
  export let onTemplate: (template: { tag: string; feel: number }) => void;

  $: minutes = Math.floor(elapsed / 60);
  $: seconds = elapsed % 60;

  function handleNoteInput(event: Event) {
    const target = event.target as HTMLTextAreaElement | null;
    if (!target) return;
    onNoteChange(target.value);
  }
</script>

<div class="card">
  <div class="toolbar" style="justify-content: space-between;">
    <div>
      <h1>Focus Session</h1>
      <p class="muted">Track your momentum, not tasks.</p>
    </div>
    <div class="badge">{running ? 'Live' : 'Idle'}</div>
  </div>

  <div style="font-size: 48px; margin: 24px 0;">
    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
  </div>

  <div class="toolbar">
    {#if running}
      <button class="btn" on:click={onStop}>Stop</button>
    {:else}
      <button class="btn" on:click={onStart}>Start</button>
    {/if}
    <button class="btn secondary" on:click={() => onFeelChange(0)}>Reset feel</button>
  </div>

  <div class="split" style="margin-top: 24px;">
    <div class="card" style="background: var(--bg-soft);">
      <h3>Feel</h3>
      <FeelToggle value={feel} onChange={onFeelChange} />
    </div>
    <div class="card" style="background: var(--bg-soft);">
      <TagPicker value={tag} suggestions={suggestions} onChange={onTagChange} />
    </div>
    <div class="card" style="background: var(--bg-soft);">
      <label class="muted" for="note-input">Session note</label>
      <textarea
        id="note-input"
        class="input"
        rows="3"
        maxlength="400"
        placeholder="What helped you stay in motion?"
        value={note}
        on:input={handleNoteInput}
      ></textarea>
    </div>
  </div>

  {#if templates.length}
    <div class="card" style="background: var(--bg-soft); margin-top: 20px;">
      <div class="toolbar">
        <span class="muted">Templates</span>
        {#each templates as template}
          <button class="btn secondary" on:click={() => onTemplate({ tag: template.tag, feel: template.feel })}>
            {template.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
