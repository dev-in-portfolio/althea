import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';

function getDeviceKey() {
  const key = 'qcf_device_key';
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

export default component$(() => {
  const loc = useLocation();
  const page = useSignal<any>(null);
  const cards = useSignal<any[]>([]);
  const selected = useSignal<string>('');

  useVisibleTask$(async () => {
    await loadPage();
  });

  async function loadPage() {
    const res = await fetch(`/api/qcf/pages/${loc.params.id}`, {
      headers: { 'X-Device-Key': getDeviceKey() },
    });
    const data = await res.json();
    page.value = data.page;
    cards.value = data.cards || [];
    selected.value = cards.value[0]?.id || '';
  }

  async function addCard() {
    const ord = cards.value.length ? Math.max(...cards.value.map((c) => c.ord)) + 1 : 1;
    const res = await fetch(`/api/qcf/pages/${loc.params.id}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Key': getDeviceKey(),
      },
      body: JSON.stringify({ type: 'text', ord, title: 'New card', body: '' }),
    });
    const data = await res.json();
    cards.value = [...cards.value, data.card];
    selected.value = data.card.id;
  }

  async function saveCard() {
    const card = cards.value.find((c) => c.id === selected.value);
    if (!card) return;
    await fetch(`/api/qcf/cards/${card.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Key': getDeviceKey(),
      },
      body: JSON.stringify(card),
    });
  }

  async function reorder(id: string, dir: number) {
    const idx = cards.value.findIndex((c) => c.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= cards.value.length) return;
    const updated = [...cards.value];
    const temp = updated[idx].ord;
    updated[idx].ord = updated[swapIdx].ord;
    updated[swapIdx].ord = temp;
    cards.value = updated.sort((a, b) => a.ord - b.ord);
    await fetch(`/api/qcf/cards/${updated[idx].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Key': getDeviceKey() },
      body: JSON.stringify({ ord: updated[idx].ord }),
    });
    await fetch(`/api/qcf/cards/${updated[swapIdx].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Key': getDeviceKey() },
      body: JSON.stringify({ ord: updated[swapIdx].ord }),
    });
  }

  async function publish(status: 'published' | 'draft') {
    const res = await fetch(`/api/qcf/pages/${loc.params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Key': getDeviceKey() },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    page.value = data.page;
  }

  const selectedCard = cards.value.find((c) => c.id === selected.value);

  return (
    <section class="grid grid-3">
      <div class="panel">
        <h3>Cards</h3>
        <button class="button" onClick$={addCard}>Add Card</button>
        <ul>
          {cards.value.map((card) => (
            <li key={card.id}>
              <button onClick$={() => (selected.value = card.id)}>
                {card.title || 'Untitled'} ({card.type})
              </button>
              <button onClick$={() => reorder(card.id, -1)}>↑</button>
              <button onClick$={() => reorder(card.id, 1)}>↓</button>
            </li>
          ))}
        </ul>
      </div>

      <div class="panel">
        <h3>Edit Card</h3>
        {selectedCard ? (
          <div>
            <label>Title</label>
            <input
              value={selectedCard.title}
              onInput$={(e) => {
                selectedCard.title = (e.target as HTMLInputElement).value;
              }}
            />
            <label>Body</label>
            <textarea
              rows={8}
              value={selectedCard.body}
              onInput$={(e) => {
                selectedCard.body = (e.target as HTMLTextAreaElement).value;
              }}
            />
            <button class="button" onClick$={saveCard}>Save</button>
          </div>
        ) : (
          <p>Select a card.</p>
        )}
      </div>

      <div class="panel">
        <h3>Publish</h3>
        <button class="button" onClick$={() => publish('published')}>Publish</button>
        <button class="button secondary" onClick$={() => publish('draft')}>Unpublish</button>
        {page.value?.published_slug && (
          <p>
            Public URL: <a href={`/p/${page.value.published_slug}`}>/p/{page.value.published_slug}</a>
          </p>
        )}
        <h3>Preview</h3>
        <div>
          {cards.value.map((card) => (
            <article key={card.id} class="panel">
              <h4>{card.title}</h4>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
});
