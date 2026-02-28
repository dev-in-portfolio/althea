import { useMemo, useState } from "preact/hooks";

type Card = {
  id: string;
  type: string;
  ord: number;
  title: string;
  body: string;
  image_url: string;
  embed_url: string;
};

type Page = {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_slug: string | null;
};

type Props = {
  page: Page;
  initialCards: Card[];
};

export default function Editor({ page, initialCards }: Props) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [activeId, setActiveId] = useState<string | null>(initialCards[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(page.status);
  const [publishedSlug, setPublishedSlug] = useState(page.published_slug);

  const active = useMemo(() => cards.find((card) => card.id === activeId) ?? null, [cards, activeId]);

  const refresh = async () => {
    const res = await fetch(`/api/cards?pageId=${page.id}`);
    const data = await res.json();
    setCards(data.cards ?? []);
  };

  const addCard = async (type: string) => {
    setBusy(true);
    await fetch("/api/cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageId: page.id, type, title: "New card", body: "", ord: cards.length + 1 }),
    });
    await refresh();
    setBusy(false);
  };

  const saveCard = async (updates: Partial<Card>) => {
    if (!active) return;
    setBusy(true);
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: active.id, ...updates }),
    });
    await refresh();
    setBusy(false);
  };

  const removeCard = async () => {
    if (!active) return;
    setBusy(true);
    await fetch("/api/cards", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: active.id }),
    });
    await refresh();
    setActiveId(cards[0]?.id ?? null);
    setBusy(false);
  };

  const moveCard = async (direction: "up" | "down") => {
    if (!active) return;
    const index = cards.findIndex((card) => card.id === active.id);
    const swapWith = direction === "up" ? cards[index - 1] : cards[index + 1];
    if (!swapWith) return;
    setBusy(true);
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: active.id, ord: swapWith.ord }),
    });
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: swapWith.id, ord: active.ord }),
    });
    await refresh();
    setBusy(false);
  };

  const publish = async (action: "publish" | "unpublish") => {
    setBusy(true);
    const res = await fetch(`/api/publish/${page.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setStatus(data.page.status);
    setPublishedSlug(data.page.published_slug);
    setBusy(false);
  };

  return (
    <div class="editor">
      <section class="panel">
        <h2>Cards</h2>
        <div class="actions">
          <button class="button" onClick={() => addCard("text")} disabled={busy}>
            Add Text
          </button>
          <button class="button ghost" onClick={() => addCard("image")} disabled={busy}>
            Add Image
          </button>
          <button class="button ghost" onClick={() => addCard("quote")} disabled={busy}>
            Add Quote
          </button>
          <button class="button ghost" onClick={() => addCard("embed")} disabled={busy}>
            Add Embed
          </button>
        </div>
        <ul class="list">
          {cards.map((card) => (
            <li key={card.id} class={card.id === activeId ? "active" : ""}>
              <button class="list-button" onClick={() => setActiveId(card.id)}>
                {card.ord}. {card.title || card.type}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section class="panel">
        <h2>Edit Card</h2>
        {active ? (
          <>
            <input
              value={active.title}
              onInput={(e) => saveCard({ title: (e.target as HTMLInputElement).value })}
              placeholder="Card title"
            />
            <textarea
              value={active.body}
              onInput={(e) => saveCard({ body: (e.target as HTMLTextAreaElement).value })}
              placeholder="Card body"
            />
            {active.type === "image" ? (
              <input
                value={active.image_url}
                onInput={(e) => saveCard({ imageUrl: (e.target as HTMLInputElement).value })}
                placeholder="Image URL"
              />
            ) : null}
            {active.type === "embed" ? (
              <input
                value={active.embed_url}
                onInput={(e) => saveCard({ embedUrl: (e.target as HTMLInputElement).value })}
                placeholder="Embed URL"
              />
            ) : null}
            <div class="actions">
              <button class="button ghost" onClick={() => moveCard("up")} disabled={busy}>
                Move Up
              </button>
              <button class="button ghost" onClick={() => moveCard("down")} disabled={busy}>
                Move Down
              </button>
              <button class="button danger" onClick={removeCard} disabled={busy}>
                Delete
              </button>
            </div>
          </>
        ) : (
          <p class="muted">Select a card to edit.</p>
        )}
      </section>
      <section class="panel">
        <h2>Publish</h2>
        <p class="muted">Status: {status}</p>
        {publishedSlug ? (
          <a class="button" href={`/p/${publishedSlug}`} target="_blank">
            Open Public Page
          </a>
        ) : null}
        <div class="actions">
          <button class="button" onClick={() => publish("publish")} disabled={busy}>
            Publish
          </button>
          <button class="button ghost" onClick={() => publish("unpublish")} disabled={busy}>
            Unpublish
          </button>
        </div>
      </section>
    </div>
  );
}
