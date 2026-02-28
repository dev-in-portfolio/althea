import { component$, useComputed$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
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

const statusBadge = (status: Signal['status']) =>
  status === 'bad' ? 'bad' : status === 'warn' ? 'warn' : 'ok';

const statusTone = (status: Signal['status']) =>
  status === 'bad' ? 'bad' : status === 'warn' ? 'warn' : 'ok';

const formatStamp = (value: string) => new Date(value).toLocaleString();

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
    loading: true,
    error: '',
    filter: 'all' as 'all' | Signal['status'],
    search: '',
    polling: true,
    lastSync: '',
  });

  const draft = useStore({
    name: '',
    kind: 'telemetry',
    note: '',
    valueNum: '',
    valueUnit: 'ms',
  });

  const busy = useSignal(false);

  const filtered = useComputed$(() => {
    return state.signals.filter((signal) => {
      if (state.filter !== 'all' && signal.status !== state.filter) return false;
      if (state.search && !signal.name.toLowerCase().includes(state.search.toLowerCase())) return false;
      return true;
    });
  });

  const stats = useComputed$(() => {
    const total = state.signals.length;
    const bad = state.signals.filter((signal) => signal.status === 'bad').length;
    const warn = state.signals.filter((signal) => signal.status === 'warn').length;
    const ok = total - bad - warn;
    return { total, bad, warn, ok };
  });

  const fetchBoard = async () => {
    state.loading = true;
    state.error = '';
    try {
      const response = await fetch(`${API_BASE}/board`, {
        headers: {
          'X-Device-Key': getDeviceKey(),
        },
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      state.signals = data.signals || [];
      state.lastSync = new Date().toLocaleTimeString();
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    } finally {
      state.loading = false;
    }
  };

  useVisibleTask$(({ track, cleanup }) => {
    track(() => state.polling);
    let timer: number | undefined;
    fetchBoard();
    if (state.polling) {
      timer = window.setInterval(fetchBoard, 15000);
    }
    cleanup(() => {
      if (timer) window.clearInterval(timer);
    });
  });

  const createSignal = async () => {
    if (!draft.name.trim()) return;
    busy.value = true;
    try {
      const response = await fetch(`${API_BASE}/signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Key': getDeviceKey(),
        },
        body: JSON.stringify({
          name: draft.name.trim(),
          kind: draft.kind.trim() || 'telemetry',
          note: draft.note.trim(),
          valueNum: draft.valueNum ? Number(draft.valueNum) : null,
          valueUnit: draft.valueUnit.trim(),
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      draft.name = '';
      draft.note = '';
      draft.valueNum = '';
      await fetchBoard();
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    } finally {
      busy.value = false;
    }
  };

  const updateStatus = async (signal: Signal, status: Signal['status']) => {
    busy.value = true;
    try {
      const response = await fetch(`${API_BASE}/signals/${signal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Key': getDeviceKey(),
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchBoard();
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    } finally {
      busy.value = false;
    }
  };

  return (
    <>
      <section class="panel hero">
        <div class="stat">
          <h3>Total Signals</h3>
          <p>{stats.value.total}</p>
        </div>
        <div class="stat">
          <h3>Bad</h3>
          <p style={{ color: 'var(--bad)' }}>{stats.value.bad}</p>
        </div>
        <div class="stat">
          <h3>Warn</h3>
          <p style={{ color: 'var(--warn)' }}>{stats.value.warn}</p>
        </div>
        <div class="stat">
          <h3>Ok</h3>
          <p style={{ color: 'var(--ok)' }}>{stats.value.ok}</p>
        </div>
      </section>

      <section class="panel">
        <h2>Signal Intake</h2>
        <p class="muted">
          Capture a signal, assign a channel, and optionally add a measured value. The rules engine will
          compute status when thresholds are set.
        </p>
        <div class="field-group" style={{ marginTop: '16px' }}>
          <input
            placeholder="Signal name"
            value={draft.name}
            onInput$={(event) => (draft.name = (event.target as HTMLInputElement).value)}
          />
          <input
            placeholder="Channel (e.g. api, billing)"
            value={draft.kind}
            onInput$={(event) => (draft.kind = (event.target as HTMLInputElement).value)}
          />
          <input
            placeholder="Value"
            value={draft.valueNum}
            onInput$={(event) => (draft.valueNum = (event.target as HTMLInputElement).value)}
          />
          <input
            placeholder="Unit"
            value={draft.valueUnit}
            onInput$={(event) => (draft.valueUnit = (event.target as HTMLInputElement).value)}
          />
        </div>
        <textarea
          placeholder="Add a short note"
          style={{ marginTop: '12px', minHeight: '80px' }}
          value={draft.note}
          onInput$={(event) => (draft.note = (event.target as HTMLTextAreaElement).value)}
        />
        <div class="actions" style={{ marginTop: '12px' }}>
          <button onClick$={createSignal} disabled={busy.value}>
            Capture Signal
          </button>
          <button class="btn-ghost" onClick$={fetchBoard} disabled={busy.value}>
            Refresh Board
          </button>
          <button class="btn-ghost" onClick$={() => (state.polling = !state.polling)}>
            {state.polling ? 'Pause Polling' : 'Resume Polling'}
          </button>
          <span class="pill">Last sync: {state.lastSync || '—'}</span>
        </div>
        {state.error ? <p class="muted mono">Error: {state.error}</p> : null}
      </section>

      <section class="panel">
        <div class="field-group">
          <select value={state.filter} onChange$={(event) => (state.filter = event.target.value as Signal['status'])}>
            <option value="all">All statuses</option>
            <option value="ok">Ok</option>
            <option value="warn">Warn</option>
            <option value="bad">Bad</option>
          </select>
          <input
            placeholder="Search by signal name"
            value={state.search}
            onInput$={(event) => (state.search = (event.target as HTMLInputElement).value)}
          />
        </div>
        <div style={{ marginTop: '18px' }}>
          {state.loading ? <p class="muted">Syncing board...</p> : null}
          <div class="grid" style={{ marginTop: '12px' }}>
            {filtered.value.map((signal) => (
              <article class="signal-card" key={signal.id}>
                <div class="signal-meta">
                  <div>
                    <h4>{signal.name}</h4>
                    <p class="muted">{signal.kind}</p>
                  </div>
                  <span class={`badge ${statusBadge(signal.status)}`}>{signal.status}</span>
                </div>
                <p>{signal.note || 'No note yet. Add context on the detail view.'}</p>
                <p class="mono">
                  Value: {signal.value_num ?? '—'} {signal.value_unit || ''}
                </p>
                <p class="muted mono">Updated {formatStamp(signal.updated_at)}</p>
                <div class="actions">
                  <button class="btn-success" onClick$={() => updateStatus(signal, 'ok')}>
                    Mark Ok
                  </button>
                  <button class="btn-ghost" onClick$={() => updateStatus(signal, 'warn')}>
                    Mark Warn
                  </button>
                  <button class="btn-danger" onClick$={() => updateStatus(signal, 'bad')}>
                    Mark Bad
                  </button>
                  <a class="pill" href={`/signal/${signal.id}`}>
                    Open Detail
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
});
