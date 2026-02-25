"use client";

import { useEffect, useState } from "react";
import useUserKey from "../lib/userKey";
import TagInput from "../components/TagInput";

export default function InputPage() {
  const userKey = useUserKey();
  const [text, setText] = useState("");
  const [weight, setWeight] = useState(3);
  const [domain, setDomain] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const loadTags = async () => {
    if (!userKey) return;
    const res = await fetch(`/api/tags?userKey=${userKey}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok && data) {
      setSuggestions((data.tags || []).map((row: any) => row.tag));
    }
  };

  useEffect(() => {
    loadTags();
  }, [userKey]);

  const submit = async () => {
    const res = await fetch("/api/statements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey,
        text,
        weight,
        domain: domain || null,
        tags
      })
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      setStatus(data?.error || "Could not save statement.");
      return;
    }
    setText("");
    setTags([]);
    setDomain("");
    setWeight(3);
    setStatus("Saved.");
    loadTags();
  };

  return (
    <div className="stack">
      <div className="hero">
        <h1>Contradict</h1>
        <h2>Enter statements and let contradictions surface with clear prompts.</h2>
      </div>

      <section className="panel stack">
        <label>
          <small>Statement</small>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="I want to take on more projects this quarter."
          />
        </label>
        <div className="grid-two">
          <label>
            <small>Weight (1-5)</small>
            <input
              type="range"
              min={1}
              max={5}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
            />
            <span className="pill">{weight}</span>
          </label>
          <label>
            <small>Domain (optional)</small>
            <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="work, health" />
          </label>
        </div>
        <label>
          <small>Tags</small>
          <TagInput tags={tags} onChange={setTags} suggestions={suggestions} />
        </label>
        <button type="button" onClick={submit}>Save statement</button>
        {status ? <small>{status}</small> : null}
      </section>
    </div>
  );
}
