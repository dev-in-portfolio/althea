import { component$, useComputed$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';
import { useLocation } from '@builder.io/qwik-city';

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

type Rule = {
  warn_if_gt: number | null;
  warn_if_lt: number | null;
  bad_if_gt: number | null;
  bad_if_lt: number | null;
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
  const location = useLocation();
  const state = useStore({
    signal: null as Signal | null,
    rule: null as Rule | null,
    error: '',
    loading: true,
  });
  const draft = useStore({
    note: '',
    valueNum: '',
    valueUnit: '',
    status: 'ok' as Signal['status'],
    warnIfGt: '',
    warnIfLt: '',
    badIfGt: '',
    badIfLt: '',
  });

  const signalId = useComputed$(() => location.params.id);

  const loadSignal = async () => {
    state.error = '';
    state.loading = true;
    try {
      const response = await fetch(`${API_BASE}/board`, {
        headers: { 'X-Device-Key': getDeviceKey() },
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const match = (data.signals || []).find((signal: Signal) => signal.id === signalId.value);
      state.signal = match || null;
      if (match) {
        draft.note = match.note || '';
        draft.valueNum = match.value_num != null ? String(match.value_num) : '';
        draft.valueUnit = match.value_unit || '';
        draft.status = match.status;
      }
      const ruleResponse = await fetch(`${API_BASE}/signals/${signalId.value}/rule`, {
        headers: { 'X-Device-Key': getDeviceKey() },
      });
      if (!ruleResponse.ok) throw new Error(await ruleResponse.text());
      const ruleData = await ruleResponse.json();
      state.rule = ruleData.rule || null;
      if (ruleData.rule) {
        draft.warnIfGt = ruleData.rule.warn_if_gt ?? '';
        draft.warnIfLt = ruleData.rule.warn_if_lt ?? '';
        draft.badIfGt = ruleData.rule.bad_if_gt ?? '';
        draft.badIfLt = ruleData.rule.bad_if_lt ?? '';
      }
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    } finally {
      state.loading = false;
    }
  };

  useVisibleTask$(() => {
    loadSignal();
  });

  const updateSignal = async () => {
    if (!state.signal) return;
    state.error = '';
    try {
      const response = await fetch(`${API_BASE}/signals/${state.signal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Key': getDeviceKey(),
        },
        body: JSON.stringify({
          note: draft.note,
          valueNum: draft.valueNum ? Number(draft.valueNum) : null,
          valueUnit: draft.valueUnit,
          status: draft.status,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      await loadSignal();
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    }
  };

  const updateRule = async () => {
    if (!state.signal) return;
    state.error = '';
    try {
      const response = await fetch(`${API_BASE}/signals/${state.signal.id}/rule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Key': getDeviceKey(),
        },
        body: JSON.stringify({
          warnIfGt: draft.warnIfGt === '' ? null : Number(draft.warnIfGt),
          warnIfLt: draft.warnIfLt === '' ? null : Number(draft.warnIfLt),
          badIfGt: draft.badIfGt === '' ? null : Number(draft.badIfGt),
          badIfLt: draft.badIfLt === '' ? null : Number(draft.badIfLt),
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      await loadSignal();
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    }
  };

  return (
    <section class="panel">
      <h2>Signal Detail</h2>
      {state.loading ? <p class="muted">Loading signal...</p> : null}
      {state.signal ? (
        <>
          <div class="signal-card">
            <div class="signal-meta">
              <div>
                <h4>{state.signal.name}</h4>
                <p class="muted">{state.signal.kind}</p>
              </div>
              <span class={`badge ${state.signal.status}`}>{state.signal.status}</span>
            </div>
            <p class="mono">Last update: {new Date(state.signal.updated_at).toLocaleString()}</p>
            <p class="mono">
              Value: {state.signal.value_num ?? '—'} {state.signal.value_unit || ''}
            </p>
          </div>

          <div class="panel" style={{ marginTop: '20px' }}>
            <h3>Manual Override</h3>
            <div class="field-group">
              <select value={draft.status} onChange$={(event) => (draft.status = event.target.value as Signal['status'])}>
                <option value="ok">Ok</option>
                <option value="warn">Warn</option>
                <option value="bad">Bad</option>
              </select>
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
              placeholder="Signal note"
              style={{ marginTop: '12px', minHeight: '90px' }}
              value={draft.note}
              onInput$={(event) => (draft.note = (event.target as HTMLTextAreaElement).value)}
            />
            <div class="actions" style={{ marginTop: '12px' }}>
              <button onClick$={updateSignal}>Update Signal</button>
              <a class="pill" href="/">
                Back to Board
              </a>
            </div>
          </div>

          <div class="panel" style={{ marginTop: '20px' }}>
            <h3>Rule Thresholds</h3>
            <p class="muted">
              Define warn and bad thresholds. When value is updated, the server computes the resulting status.
            </p>
            <div class="field-group" style={{ marginTop: '12px' }}>
              <input
                placeholder="Warn if >"
                value={String(draft.warnIfGt)}
                onInput$={(event) => (draft.warnIfGt = (event.target as HTMLInputElement).value)}
              />
              <input
                placeholder="Warn if <"
                value={String(draft.warnIfLt)}
                onInput$={(event) => (draft.warnIfLt = (event.target as HTMLInputElement).value)}
              />
              <input
                placeholder="Bad if >"
                value={String(draft.badIfGt)}
                onInput$={(event) => (draft.badIfGt = (event.target as HTMLInputElement).value)}
              />
              <input
                placeholder="Bad if <"
                value={String(draft.badIfLt)}
                onInput$={(event) => (draft.badIfLt = (event.target as HTMLInputElement).value)}
              />
            </div>
            <div class="actions" style={{ marginTop: '12px' }}>
              <button onClick$={updateRule}>Save Rule</button>
            </div>
          </div>
        </>
      ) : (
        <p class="muted">Signal not found.</p>
      )}
      {state.error ? <p class="muted mono">Error: {state.error}</p> : null}
    </section>
  );
});
