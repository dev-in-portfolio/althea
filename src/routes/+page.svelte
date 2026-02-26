<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import TimerPanel from '$lib/components/TimerPanel.svelte';
  import FeelToggle from '$lib/components/FeelToggle.svelte';
  import { clearStoredStart, getStoredStart, secondsBetween, setStoredStart } from '$lib/client/timer';
  import { enqueueSession, flushQueue, getQueueStatus } from '$lib/client/offlineQueue';
  import { getUserKey } from '$lib/client/userKey';

  export let data: { metrics: any | null };

  let running = false;
  let startAt: Date | null = null;
  let elapsed = 0;
  let feel = 0;
  let tag = 'Build';
  let note = '';
  let status = '';
  let metrics = data.metrics;
  let timer: number | null = null;
  let recentTags: string[] = [];
  let manualOpen = false;
  let manualStart = '';
  let manualEnd = '';
  let manualTag = 'Build';
  let manualFeel = 0;
  let manualNote = '';
  let queueStatus = { pending: 0, lastError: '' };

  const templates = [
    { label: 'Deep Build', tag: 'Build', feel: 1 },
    { label: 'Study Sprint', tag: 'Study', feel: 0 },
    { label: 'Ops Reset', tag: 'Ops', feel: -1 }
  ];

  const DRAFT_KEY = 'momentum_draft';

  const tick = () => {
    if (!startAt) return;
    elapsed = secondsBetween(startAt, new Date());
  };

  async function loadMetrics() {
    try {
      const res = await fetch('/api/metrics', { headers: { 'x-user-key': getUserKey() } });
      if (!res.ok) return;
      metrics = await res.json();
    } catch {
      // ignore
    }
  }

  async function loadRecentTags() {
    try {
      const res = await fetch('/api/sessions?limit=60', { headers: { 'x-user-key': getUserKey() } });
      if (!res.ok) return;
      const data = await res.json();
      const tags = (data.items || [])
        .map((item: any) => item.tag)
        .filter(Boolean);
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const t of tags) {
        if (!seen.has(t)) {
          seen.add(t);
          unique.push(t);
        }
      }
      recentTags = unique.slice(0, 6);
    } catch {
      // ignore
    }
  }

  function loadDraft() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      tag = draft.tag ?? tag;
      feel = draft.feel ?? feel;
      note = draft.note ?? note;
    } catch {
      // ignore
    }
  }

  function saveDraft() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ tag, feel, note }));
  }

  function start() {
    startAt = new Date();
    running = true;
    elapsed = 0;
    setStoredStart(startAt);
    timer = window.setInterval(tick, 1000);
  }

  async function stop() {
    if (!startAt) return;
    const endedAt = new Date();
    const duration = secondsBetween(startAt, endedAt);
    const payload = {
      startedAt: startAt.toISOString(),
      endedAt: endedAt.toISOString(),
      duration,
      tag,
      feel,
      notes: note
    };

    running = false;
    startAt = null;
    clearStoredStart();
    if (timer) window.clearInterval(timer);
    elapsed = 0;

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-key': getUserKey() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        enqueueSession(payload);
        status = 'Saved offline. Will sync when online.';
      } else {
        status = 'Session saved.';
      }
    } catch {
      enqueueSession(payload);
      status = 'Saved offline. Will sync when online.';
    }
    await loadMetrics();
    await loadRecentTags();
  }

  async function saveManual() {
    if (!manualStart || !manualEnd) {
      status = 'Manual sessions need a start and end.';
      return;
    }
    const start = new Date(manualStart);
    const end = new Date(manualEnd);
    const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 1000));
    const payload = {
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
      duration,
      tag: manualTag,
      feel: manualFeel,
      notes: manualNote
    };
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-key': getUserKey() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        enqueueSession(payload);
        status = 'Saved offline. Will sync when online.';
      } else {
        status = 'Manual session saved.';
      }
    } catch {
      enqueueSession(payload);
      status = 'Saved offline. Will sync when online.';
    }
    manualOpen = false;
    manualStart = '';
    manualEnd = '';
    manualNote = '';
    await loadMetrics();
    await loadRecentTags();
  }

  onMount(() => {
    loadDraft();
    startAt = getStoredStart();
    if (startAt) {
      running = true;
      tick();
      timer = window.setInterval(tick, 1000);
    }
    flushQueue();
    window.addEventListener('online', flushQueue);
    loadMetrics();
    loadRecentTags();
    queueStatus = getQueueStatus();

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.code === 'Space') {
        event.preventDefault();
        running ? stop() : start();
      }
      if (event.key === '1') onFeelChange(-1);
      if (event.key === '2') onFeelChange(0);
      if (event.key === '3') onFeelChange(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  function onFeelChange(value: number) {
    feel = value;
    saveDraft();
  }

  function onTagChange(value: string) {
    tag = value;
    saveDraft();
  }

  function onNoteChange(value: string) {
    note = value;
    saveDraft();
  }

  function applyTemplate(template: { tag: string; feel: number }) {
    tag = template.tag;
    feel = template.feel;
    saveDraft();
  }

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    if (timer) window.clearInterval(timer);
    window.removeEventListener('online', flushQueue);
  });
</script>

<main class="grid">
  <TimerPanel
    {running}
    {elapsed}
    {tag}
    {feel}
    note={note}
    suggestions={recentTags}
    templates={templates}
    onStart={start}
    onStop={stop}
    onTagChange={onTagChange}
    onFeelChange={onFeelChange}
    onNoteChange={onNoteChange}
    onTemplate={applyTemplate}
  />

  <div class="split">
    <div class="card">
      <h3>Quick Stats</h3>
      <p class="muted">Today minutes: {metrics?.dailyTotals?.at(-1)?.seconds ? Math.round(metrics.dailyTotals.at(-1).seconds / 60) : 0}</p>
      <p class="muted">Current streak: {metrics?.streakDays ?? 0} days</p>
      <p class="muted">Flow ratio: {metrics ? Math.round(metrics.flowRatio * 100) : 0}%</p>
      <p class="muted">Velocity: {metrics?.velocity ? Math.round(metrics.velocity / 60) : 0} mins/day</p>
    </div>
    <div class="card">
      <h3>Status</h3>
      <p class="muted">{status || 'Ready to track your next session.'}</p>
      {#if queueStatus.pending}
        <p class="muted">Queued sync: {queueStatus.pending} pending</p>
        {#if queueStatus.lastError}
          <p class="danger">{queueStatus.lastError}</p>
        {/if}
      {/if}
      <div class="toolbar" style="margin-top: 12px;">
        <button class="btn secondary" on:click={() => (manualOpen = !manualOpen)}>
          {manualOpen ? 'Close manual' : 'Add manual session'}
        </button>
        <button class="btn secondary" on:click={async () => { await flushQueue(); queueStatus = getQueueStatus(); }}>
          Sync now
        </button>
      </div>
    </div>
  </div>

  {#if manualOpen}
    <div class="card">
      <h3>Manual Session</h3>
      <div class="grid" style="gap: 12px;">
        <label class="muted" for="manual-start">Start</label>
        <input id="manual-start" class="input" type="datetime-local" bind:value={manualStart} />
        <label class="muted" for="manual-end">End</label>
        <input id="manual-end" class="input" type="datetime-local" bind:value={manualEnd} />
        <label class="muted" for="manual-tag">Tag</label>
        <input id="manual-tag" class="input" bind:value={manualTag} />
        <span class="muted">Feel</span>
        <FeelToggle value={manualFeel} onChange={(value) => (manualFeel = value)} />
        <label class="muted" for="manual-note">Notes</label>
        <textarea id="manual-note" class="input" rows="2" maxlength="400" bind:value={manualNote}></textarea>
      </div>
      <div class="toolbar" style="margin-top: 16px;">
        <button class="btn" on:click={saveManual}>Save manual session</button>
      </div>
    </div>
  {/if}
</main>
