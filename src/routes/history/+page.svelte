<script lang="ts">
  import SessionRow from '$lib/components/SessionRow.svelte';
  import { getUserKey } from '$lib/client/userKey';

  export let data: { items: any[]; error: string; hasMore: boolean };

  let items = data.items;
  let error = data.error;
  let hasMore = data.hasMore;
  let loadingMore = false;

  async function handleDelete(id: string) {
    if (!confirm('Delete this session?')) return;
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-key': getUserKey() }
    });
    if (!res.ok) {
      error = 'Failed to delete session.';
      return;
    }
    items = items.filter((item) => item.id !== id);
  }

  async function handleUpdate(id: string, update: { tag: string; feel: number; notes: string }) {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-user-key': getUserKey() },
      body: JSON.stringify(update)
    });
    if (!res.ok) {
      error = 'Failed to update session.';
      return;
    }
    items = items.map((item) => (item.id === id ? { ...item, ...update } : item));
  }

  async function handleSplit(id: string) {
    const session = items.find((item) => item.id === id);
    if (!session) return;
    const start = new Date(session.startedAt);
    const end = new Date(session.endedAt);
    const mid = new Date((start.getTime() + end.getTime()) / 2);
    if (!confirm('Split this session into two halves?')) return;

    const first = {
      startedAt: start.toISOString(),
      endedAt: mid.toISOString(),
      duration: Math.max(1, Math.round((mid.getTime() - start.getTime()) / 1000)),
      tag: session.tag,
      feel: session.feel,
      notes: session.notes || ''
    };
    const second = {
      startedAt: mid.toISOString(),
      endedAt: end.toISOString(),
      duration: Math.max(1, Math.round((end.getTime() - mid.getTime()) / 1000)),
      tag: session.tag,
      feel: session.feel,
      notes: session.notes || ''
    };

    try {
      const resA = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-key': getUserKey() },
        body: JSON.stringify(first)
      });
      const resB = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-key': getUserKey() },
        body: JSON.stringify(second)
      });
      if (!resA.ok || !resB.ok) throw new Error('split failed');
      await handleDelete(id);
      error = '';
    } catch {
      error = 'Failed to split session.';
    }
  }

  async function loadMore() {
    if (loadingMore || !items.length) return;
    loadingMore = true;
    const last = items[items.length - 1];
    const before = encodeURIComponent(last.startedAt);
    try {
      const res = await fetch(`/api/sessions?limit=50&before=${before}`, {
        headers: { 'x-user-key': getUserKey() }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load more.');
      items = [...items, ...(data.items || [])];
      hasMore = (data.items || []).length === 50;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load more.';
    } finally {
      loadingMore = false;
    }
  }
</script>

<main class="grid">
  <div class="card">
    <h1>History</h1>
    <p class="muted">Edit or delete past sessions.</p>
    {#if error}
      <p class="danger">{error}</p>
    {/if}
  </div>

  {#if !items.length}
    <div class="card">
      <p class="muted">No sessions yet.</p>
    </div>
  {:else}
    {#each items as session}
      <SessionRow
        {session}
        onEdit={(id) => (window.location.href = `/session/${id}`)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onSplit={handleSplit}
      />
    {/each}
    {#if hasMore}
      <div class="card">
        <button class="btn secondary" on:click={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      </div>
    {/if}
  {/if}
</main>
