import './index.css';
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

const dataset = [
  { id: 1, title: 'Archive Node', tag: 'core', status: 'active' },
  { id: 2, title: 'Signal Relay', tag: 'ops', status: 'active' },
  { id: 3, title: 'Atlas Bridge', tag: 'infra', status: 'paused' },
  { id: 4, title: 'Nimbus Cache', tag: 'core', status: 'active' },
  { id: 5, title: 'Echo Stack', tag: 'ops', status: 'retired' },
  { id: 6, title: 'Flux Wire', tag: 'infra', status: 'active' },
];

function getDeviceKey() {
  const key = 'qwik_atlas_device_key';
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

export default component$(() => {
  const query = useSignal('');
  const tag = useSignal('');
  const status = useSignal('');
  const sort = useSignal('title');
  const layout = useSignal<'grid' | 'list'>('grid');
  const views = useSignal<any[]>([]);
  const selectedView = useSignal('');
  const saveName = useSignal('');
  const message = useSignal('');

  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    query.value = url.searchParams.get('q') || '';
    tag.value = url.searchParams.get('tag') || '';
    status.value = url.searchParams.get('status') || '';
    sort.value = url.searchParams.get('sort') || 'title';
    layout.value = (url.searchParams.get('layout') as 'grid' | 'list') || 'grid';
    loadViews();
  });

  const filtered = dataset
    .filter((item) => (query.value ? item.title.toLowerCase().includes(query.value.toLowerCase()) : true))
    .filter((item) => (tag.value ? item.tag === tag.value : true))
    .filter((item) => (status.value ? item.status === status.value : true))
    .sort((a, b) => (sort.value === 'title' ? a.title.localeCompare(b.title) : a.status.localeCompare(b.status)));

  function syncUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('q', query.value || '');
    url.searchParams.set('tag', tag.value || '');
    url.searchParams.set('status', status.value || '');
    url.searchParams.set('sort', sort.value || 'title');
    url.searchParams.set('layout', layout.value);
    window.history.replaceState({}, '', url.toString());
  }

  async function loadViews() {
    try {
      const res = await fetch(`/api/qwik-atlas/views?route=/`, {
        headers: { 'X-Device-Key': getDeviceKey() },
      });
      const data = await res.json();
      views.value = data.views || [];
    } catch (err) {
      message.value = 'Failed to load views';
    }
  }

  async function saveView() {
    try {
      const payload = {
        name: saveName.value,
        route: '/',
        state: {
          q: query.value,
          filters: { tag: tag.value ? [tag.value] : [], status: status.value ? [status.value] : [] },
          sort: { field: sort.value, dir: 'asc' },
          layout: layout.value,
        },
      };
      const res = await fetch('/api/qwik-atlas/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Key': getDeviceKey(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      saveName.value = '';
      await loadViews();
      message.value = 'View saved.';
    } catch {
      message.value = 'Save failed.';
    }
  }

  function applyView(id: string) {
    const view = views.value.find((v) => v.id === id);
    if (!view) return;
    const state = view.state || {};
    query.value = state.q || '';
    tag.value = state.filters?.tag?.[0] || '';
    status.value = state.filters?.status?.[0] || '';
    sort.value = state.sort?.field || 'title';
    layout.value = state.layout || 'grid';
    syncUrl();
  }

  return (
    <section class="browser">
      <div class="controls">
        <input
          placeholder="Search"
          value={query.value}
          onInput$={(e) => {
            query.value = (e.target as HTMLInputElement).value;
            syncUrl();
          }}
        />
        <select
          value={tag.value}
          onChange$={(e) => {
            tag.value = (e.target as HTMLSelectElement).value;
            syncUrl();
          }}
        >
          <option value="">All tags</option>
          <option value="core">core</option>
          <option value="ops">ops</option>
          <option value="infra">infra</option>
        </select>
        <select
          value={status.value}
          onChange$={(e) => {
            status.value = (e.target as HTMLSelectElement).value;
            syncUrl();
          }}
        >
          <option value="">All status</option>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="retired">retired</option>
        </select>
        <select
          value={sort.value}
          onChange$={(e) => {
            sort.value = (e.target as HTMLSelectElement).value;
            syncUrl();
          }}
        >
          <option value="title">Sort by title</option>
          <option value="status">Sort by status</option>
        </select>
        <button
          class="button secondary"
          onClick$={() => {
            layout.value = layout.value === 'grid' ? 'list' : 'grid';
            syncUrl();
          }}
        >
          Layout: {layout.value}
        </button>
      </div>

      <div class="views">
        <select value={selectedView.value} onChange$={(e) => applyView((e.target as HTMLSelectElement).value)}>
          <option value="">Saved views</option>
          {views.value.map((view) => (
            <option value={view.id} key={view.id}>
              {view.name}
            </option>
          ))}
        </select>
        <input placeholder="View name" value={saveName.value} onInput$={(e) => (saveName.value = (e.target as HTMLInputElement).value)} />
        <button class="button" onClick$={saveView}>Save View</button>
        <span class="muted">{message.value}</span>
      </div>

      <div class={layout.value === 'grid' ? 'grid grid-3' : 'list'}>
        {filtered.map((item) => (
          <article key={item.id} class="panel item">
            <h3>{item.title}</h3>
            <p class="muted">{item.tag} · {item.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
});
