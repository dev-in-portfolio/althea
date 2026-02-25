"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useUserKey from "../../lib/userKey";

export default function NewSessionPage() {
  const userKey = useUserKey();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const lines = items.split("\n").map((line) => line.trim()).filter(Boolean);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userKey, title, items: lines })
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      setError(data?.error || "Could not create session.");
      return;
    }
    router.push(`/arena/${data.id}`);
  };

  return (
    <div className="stack">
      <div className="hero">
        <h1>New Session</h1>
        <h2>Paste a list and let the funnel do the work.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="panel stack">
        <label>
          <small>Session title</small>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What are you deciding?" />
        </label>
        <label>
          <small>Items (one per line)</small>
          <textarea value={items} onChange={(event) => setItems(event.target.value)} placeholder="Option A\nOption B\nOption C" />
        </label>
        <button type="button" onClick={create}>Start collapse</button>
      </section>
    </div>
  );
}
