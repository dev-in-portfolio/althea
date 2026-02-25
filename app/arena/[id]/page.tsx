"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useUserKey from "../../../lib/userKey";

type Pair = {
  a: { id: string; label: string };
  b: { id: string; label: string };
  key: string;
};

export default function ArenaPage({ params }: { params: { id: string } }) {
  const userKey = useUserKey();
  const router = useRouter();
  const [pair, setPair] = useState<Pair | null>(null);
  const [progress, setProgress] = useState({ comparisons: 0, cap: 0, coverage: 0 });
  const [error, setError] = useState<string | null>(null);
  const [skipsLeft, setSkipsLeft] = useState(3);
  const [skipPairs, setSkipPairs] = useState<string[]>([]);

  const loadNext = async () => {
    if (!userKey) return;
    const exclude = skipPairs.join(",");
    const res = await fetch(`/api/sessions/${params.id}/next?userKey=${userKey}&exclude=${exclude}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      setError("Could not load next pair.");
      return;
    }
    if (data.done) {
      router.push(`/results/${params.id}`);
      return;
    }
    setPair(data.pair);
    setProgress({ comparisons: data.comparisons, cap: data.cap, coverage: data.coverage });
    setError(null);
    if (data.skipsUsed !== undefined && data.maxSkips !== undefined) {
      setSkipsLeft(data.maxSkips - data.skipsUsed);
    }
  };

  const decide = async (winnerId: string) => {
    if (!pair) return;
    const res = await fetch(`/api/sessions/${params.id}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey,
        aItemId: pair.a.id,
        bItemId: pair.b.id,
        winnerItemId: winnerId
      })
    });
    if (!res.ok) {
      setError("Could not save decision.");
      return;
    }
    await loadNext();
  };

  const skip = async () => {
    if (!pair || skipsLeft <= 0) return;
    const res = await fetch(`/api/sessions/${params.id}/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userKey })
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      setError("Skip failed.");
      return;
    }
    const remaining = data.maxSkips - data.skipsUsed;
    setSkipsLeft(remaining);
    setSkipPairs((prev) => [...prev, pair.key]);
    await loadNext();
  };

  useEffect(() => {
    loadNext();
  }, [userKey]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>Collapse Arena</h1>
        <h2>Choose the stronger option. Repeat until clarity locks in.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="pill">{progress.comparisons} / {progress.cap || "∞"} decisions</span>
          <span className="pill">Confidence {(progress.coverage * 100).toFixed(0)}%</span>
          <span className="pill">Skips left {skipsLeft}</span>
        </div>
      </section>

      {pair ? (
        <section className="grid-two">
          <div className="choice-card">
            <div className="badge">Option A</div>
            <h3>{pair.a.label}</h3>
            <button type="button" onClick={() => decide(pair.a.id)}>Choose A</button>
          </div>
          <div className="choice-card">
            <div className="badge">Option B</div>
            <h3>{pair.b.label}</h3>
            <button type="button" onClick={() => decide(pair.b.id)}>Choose B</button>
          </div>
        </section>
      ) : (
        <div className="card">Loading pair...</div>
      )}

      <div className="row">
        <button type="button" className="secondary" onClick={skip} disabled={skipsLeft <= 0}>
          Skip
        </button>
        <button type="button" className="secondary" onClick={() => router.push(`/results/${params.id}`)}>
          View current ranking
        </button>
      </div>
    </div>
  );
}
