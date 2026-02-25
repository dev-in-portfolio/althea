"use client";

import { useEffect, useState } from "react";
import useUserKey from "../../lib/useUserKey";

type Signal = {
  signalType: string;
  headline: string;
  evidence: string;
  confidence: number;
  supportingTags: string[];
  supportingEventIds?: string[];
};

type SignalPayload = {
  windowDays: number;
  computedAt: string;
  signals: Signal[];
};

export default function SignalsPage() {
  const userKey = useUserKey();
  const [windowDays, setWindowDays] = useState(30);
  const [payload, setPayload] = useState<SignalPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<Record<string, string[]>>({});

  const load = async () => {
    if (!userKey) return;
    setLoading(true);
    const res = await fetch(`/api/signals?userKey=${userKey}&window=${windowDays}d`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok && data) {
      setPayload(data);
    }
    setLoading(false);
  };

  const loadSamples = async (signal: Signal) => {
    if (!userKey) return;
    const key = `${signal.signalType}-${signal.headline}`;
    if (samples[key]) return;
    const params = new URLSearchParams({
      userKey,
      limit: "5",
      tags: signal.supportingTags.join(",")
    });
    const res = await fetch(`/api/events?${params.toString()}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    const notes = (data?.events || []).map((event: any) => event.note);
    setSamples((prev) => ({ ...prev, [key]: notes }));
  };

  useEffect(() => {
    if (userKey) {
      load();
    }
  }, [userKey, windowDays]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>Signals</h1>
        <h2>Patterns detected from your recent events.</h2>
      </div>

      <section className="panel row">
        <label>
          <small>Window (days)</small>
          <select value={windowDays} onChange={(event) => setWindowDays(Number(event.target.value))}>
            <option value={14}>14</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
            <option value={120}>120</option>
          </select>
        </label>
        <button type="button" className="secondary" onClick={load}>
          Refresh
        </button>
        {payload ? <small>Updated {new Date(payload.computedAt).toLocaleString()}</small> : null}
      </section>

      <section className="list">
        {loading && <div className="card">Loading signals...</div>}
        {!loading && payload?.signals?.length === 0 && (
          <div className="card">No signals yet. Add more events.</div>
        )}
        {payload?.signals?.map((signal, index) => (
          <div key={`${signal.signalType}-${index}`} className="card stack">
            <div className="badge">{signal.signalType}</div>
            <strong>{signal.headline}</strong>
            <small>{signal.evidence}</small>
            <div className="row">
              {signal.supportingTags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <button type="button" className="secondary" onClick={() => loadSamples(signal)}>
              Show sample events
            </button>
            {samples[`${signal.signalType}-${signal.headline}`]?.length ? (
              <div className="stack">
                {samples[`${signal.signalType}-${signal.headline}`].map((note, idx) => (
                  <small key={`${signal.headline}-${idx}`}>“{note}”</small>
                ))}
              </div>
            ) : null}
            <small>Confidence: {(signal.confidence * 100).toFixed(0)}%</small>
          </div>
        ))}
      </section>
    </div>
  );
}
