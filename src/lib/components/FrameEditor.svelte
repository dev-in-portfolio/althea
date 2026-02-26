<script lang="ts">
  import { getUserKey } from '$lib/client/userKey';

  export let projectId: string;
  export let frame: { id: string; title: string; body: string; imageUrl: string | null } | null = null;
  export let onSaved: (frame: any) => void;

  let title = '';
  let body = '';
  let imageUrl = '';
  let error = '';
  let loading = false;

  $: if (frame) {
    title = frame.title || '';
    body = frame.body || '';
    imageUrl = frame.imageUrl || '';
  }

  async function submit() {
    error = '';
    if (!body.trim()) {
      error = 'Body is required.';
      return;
    }
    loading = true;
    try {
      const payload = {
        title,
        body,
        imageUrl: imageUrl ? imageUrl : null
      };
      const res = await fetch(`/api/projects/${projectId}/frames${frame ? `/${frame.id}` : ''}`, {
        method: frame ? 'PATCH' : 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-key': getUserKey()
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Failed to save frame.';
      } else {
        onSaved(data);
        if (!frame) {
          title = '';
          body = '';
          imageUrl = '';
        }
      }
    } catch (err) {
      error = 'Network error.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="card">
  <h2>{frame ? 'Edit Frame' : 'New Frame'}</h2>
  <div class="grid">
    <input class="input" placeholder="Title" bind:value={title} />
    <textarea class="input" rows="6" placeholder="Frame body" bind:value={body}></textarea>
    <input class="input" placeholder="Image URL (optional)" bind:value={imageUrl} />
    <button class="btn" on:click={submit} disabled={loading}>{frame ? 'Update' : 'Add Frame'}</button>
    {#if error}
      <p class="small">{error}</p>
    {/if}
  </div>
</div>
