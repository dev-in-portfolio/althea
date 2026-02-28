import { useState } from "preact/hooks";

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim() || !slug.trim()) return;
    setBusy(true);
    await fetch("/api/pages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, slug }),
    });
    window.location.reload();
  };

  return (
    <section class="panel">
      <h2>Create Draft</h2>
      <div class="row">
        <input
          placeholder="Title"
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
        />
        <input
          placeholder="slug"
          value={slug}
          onInput={(e) => setSlug((e.target as HTMLInputElement).value)}
        />
        <button class="button" onClick={create} disabled={busy}>
          {busy ? "Creating..." : "Create"}
        </button>
      </div>
    </section>
  );
}
