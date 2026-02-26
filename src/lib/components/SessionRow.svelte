<script lang="ts">
  import FeelToggle from './FeelToggle.svelte';

  export let session: {
    id: string;
    startedAt: string;
    endedAt: string;
    duration: number;
    tag: string;
    feel: number;
    notes?: string;
  };
  export let onEdit: (id: string) => void;
  export let onDelete: (id: string) => void;
  export let onUpdate: (id: string, update: { tag: string; feel: number; notes: string }) => void;
  export let onSplit: (id: string) => void;

  $: durationMinutes = Math.round(session.duration / 60);
  const feelLabel = (feel: number) => (feel === 1 ? 'Flow' : feel === -1 ? 'Drag' : 'Neutral');

  let editing = false;
  let tag = session.tag;
  let feel = session.feel;
  let notes = session.notes ?? '';

  $: if (!editing) {
    tag = session.tag;
    feel = session.feel;
    notes = session.notes ?? '';
  }

  function handleSave() {
    onUpdate(session.id, { tag, feel, notes });
    editing = false;
  }
</script>

<div class="card">
  <div class="toolbar" style="justify-content: space-between;">
    <div>
      <strong>{session.tag}</strong>
      <span class="muted"> · {feelLabel(session.feel)}</span>
    </div>
    <div class="toolbar">
      <button class="btn secondary" on:click={() => onEdit(session.id)}>Edit</button>
      <button class="btn secondary" on:click={() => (editing = !editing)}>{editing ? 'Cancel' : 'Quick edit'}</button>
      <button class="btn secondary" on:click={() => onSplit(session.id)}>Split</button>
      <button class="btn ghost danger" on:click={() => onDelete(session.id)}>Delete</button>
    </div>
  </div>
  <p class="muted" style="margin-top: 8px;">
    {new Date(session.startedAt).toLocaleString()} → {new Date(session.endedAt).toLocaleTimeString()}
  </p>
  <p style="margin-top: 4px;">{durationMinutes} min</p>
  {#if session.notes}
    <p class="muted" style="margin-top: 6px;">{session.notes}</p>
  {/if}

  {#if editing}
    <div class="grid" style="gap: 12px; margin-top: 12px;">
      <label class="muted" for={`tag-${session.id}`}>Tag</label>
      <input id={`tag-${session.id}`} class="input" bind:value={tag} />

      <span class="muted">Feel</span>
      <FeelToggle value={feel} onChange={(value) => (feel = value)} />

      <label class="muted" for={`note-${session.id}`}>Notes</label>
      <textarea id={`note-${session.id}`} class="input" rows="2" maxlength="400" bind:value={notes}></textarea>
    </div>
    <div class="toolbar" style="margin-top: 12px;">
      <button class="btn" on:click={handleSave}>Save changes</button>
    </div>
  {/if}
</div>
