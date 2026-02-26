<script lang="ts">
  import { getUserKey } from '$lib/client/userKey';
  import FeelToggle from '$lib/components/FeelToggle.svelte';

  export let data: { session: any | null };

  let session = data.session;
  let status = '';

  let tag = session?.tag ?? '';
  let feel = session?.feel ?? 0;
  let startedAt = session?.startedAt ? new Date(session.startedAt).toISOString().slice(0, 16) : '';
  let endedAt = session?.endedAt ? new Date(session.endedAt).toISOString().slice(0, 16) : '';
  let duration = session?.duration ?? 0;
  let notes = session?.notes ?? '';

  function computeDuration() {
    if (!startedAt || !endedAt) return duration;
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 1000));
  }

  async function save() {
    if (!session) return;
    const payload = {
      tag,
      feel,
      notes,
      startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
      endedAt: endedAt ? new Date(endedAt).toISOString() : undefined,
      duration: computeDuration()
    };

    const res = await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-user-key': getUserKey() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      status = 'Failed to save.';
      return;
    }
    status = 'Saved.';
  }
</script>

<main class="grid">
  <div class="card">
    <h1>Edit Session</h1>
    {#if !session}
      <p class="muted">Session not found.</p>
    {:else}
      <p class="muted">Adjust tag, feel, or timing.</p>
    {/if}
    {#if status}
      <p class="muted">{status}</p>
    {/if}
  </div>

  {#if session}
    <div class="card">
      <div class="grid" style="gap: 16px;">
        <label class="muted" for="tag-input">Tag</label>
        <input id="tag-input" class="input" bind:value={tag} />

        <span class="muted">Feel</span>
        <FeelToggle value={feel} onChange={(value) => (feel = value)} />

        <label class="muted" for="started-at">Started At</label>
        <input id="started-at" class="input" type="datetime-local" bind:value={startedAt} />

        <label class="muted" for="ended-at">Ended At</label>
        <input id="ended-at" class="input" type="datetime-local" bind:value={endedAt} />

        <label class="muted" for="duration">Duration (seconds)</label>
        <input id="duration" class="input" type="number" min="1" max="86400" bind:value={duration} />

        <label class="muted" for="notes">Notes</label>
        <textarea id="notes" class="input" rows="3" maxlength="400" bind:value={notes}></textarea>
      </div>
      <div class="toolbar" style="margin-top: 20px;">
        <button class="btn" on:click={save}>Save</button>
        <a class="btn secondary" href="/history">Back</a>
      </div>
    </div>
  {/if}
</main>
