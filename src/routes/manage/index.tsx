import { component$, useSignal, useStore } from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';

type Signal = {
  id: string;
  name: string;
  kind: string;
  status: 'ok' | 'warn' | 'bad';
  note: string;
  value_num: number | null;
  value_unit: string | null;
  updated_at: string;
  created_at: string;
};

const API_BASE = '/api/qst';
const DEVICE_KEY = 'qst_device_key';

function getDeviceKey() {
  if (!isBrowser) return '';
  let key = localStorage.getItem(DEVICE_KEY);
  if (!key) {
    key = crypto.randomUUID ? crypto.randomUUID() : `qst-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, key);
  }
  return key;
}

export default component$(() => {
  const state = useStore({
    signals: [] as Signal[],
    error: '',
    message: '',
  });
  const busy = useSignal(false);

  const fetchBoard = async () => {
    state.error = '';
    try {
      const response = await fetch(`${API_BASE}/board`, {
        headers: { 'X-Device-Key': getDeviceKey() },
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      state.signals = data.signals || [];
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    }
  };

  const seedSignals = async () => {
    busy.value = true;
    state.message = '';
    try {
      const payloads = [
        { name: 'Auth handshake latency', kind: 'auth', note: 'Spike on EU west region', valueNum: 420, valueUnit: 'ms' },
        { name: 'Billing retries', kind: 'billing', note: 'Provider failover engaged', valueNum: 12, valueUnit: 'events' },
        { name: 'Search queue backlog', kind: 'search', note: 'Monitor job runners', valueNum: 240, valueUnit: 'jobs' },
      ];
      for (const payload of payloads) {
        const response = await fetch(`${API_BASE}/signals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Key': getDeviceKey(),
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(await response.text());
      }
      await fetchBoard();
      state.message = 'Seeded three sample signals.';
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    } finally {
      busy.value = false;
    }
  };

  const deleteSignal = async (id: string) => {
    busy.value = true;
    try {
      const response = await fetch(`${API_BASE}/signals/${id}`, {
        method: 'DELETE',
        headers: { 'X-Device-Key': getDeviceKey() },
      });
      if (!response.ok) throw new Error(await response.text());
      state.signals = state.signals.filter((signal) => signal.id !== id);
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    } finally {
      busy.value = false;
    }
  };

  return (
    <section class="panel">
      <h2>Signal Management</h2>
      <p class="muted">
        Bulk utilities for seeding, pruning, and inspecting the signal set linked to this device key.
      </p>
      <div class="actions" style={{ marginTop: '12px' }}>
        <button onClick$={fetchBoard} disabled={busy.value}>
          Load Signals
        </button>
        <button class="btn-ghost" onClick$={seedSignals} disabled={busy.value}>
          Seed Sample Signals
        </button>
      </div>
      {state.message ? <p class="muted mono">{state.message}</p> : null}
      {state.error ? <p class="muted mono">Error: {state.error}</p> : null}
      <div class="grid" style={{ marginTop: '16px' }}>
        {state.signals.map((signal) => (
          <article class="signal-card" key={signal.id}>
            <div class="signal-meta">
              <div>
                <h4>{signal.name}</h4>
                <p class="muted">{signal.kind}</p>
              </div>
              <span class={`badge ${signal.status}`}>{signal.status}</span>
            </div>
            <p>{signal.note || 'No note added.'}</p>
            <p class="mono">
              Value: {signal.value_num ?? '—'} {signal.value_unit || ''}
            </p>
            <div class="actions">
              <a class="pill" href={`/signal/${signal.id}`}>
                Open Detail
              </a>
              <button class="btn-danger" onClick$={() => deleteSignal(signal.id)} disabled={busy.value}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});
