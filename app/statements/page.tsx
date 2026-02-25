"use client";

import { useEffect, useState } from "react";
import useUserKey from "../../lib/userKey";

export default function StatementsPage() {
  const userKey = useUserKey();
  const [statements, setStatements] = useState<any[]>([]);
  const [domain, setDomain] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userKey) return;
    const params = new URLSearchParams({ userKey });
    if (domain) params.set("domain", domain);
    const res = await fetch(`/api/statements?${params.toString()}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      setError("Backend not configured. Set DATABASE_URL and run migrations.");
      return;
    }
    let items = data.statements || [];
    if (tagFilter) {
      items = items.filter((item: any) => (item.tags || []).includes(tagFilter));
    }
    setStatements(items);
    setError(null);
  };

  const remove = async (id: string) => {
    await fetch(`/api/statements/${id}?userKey=${userKey}`, { method: "DELETE" });
    load();
  };

  useEffect(() => {
    load();
  }, [userKey, domain, tagFilter]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>Statement Library</h1>
        <h2>Review, filter, and delete statements.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="panel stack">
        <div className="grid-two">
          <label>
            <small>Filter by domain</small>
            <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="work, health" />
          </label>
          <label>
            <small>Filter by tag</small>
            <input value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} placeholder="growth" />
          </label>
        </div>
      </section>

      <section className="stack">
        {statements.map((statement) => (
          <div key={statement.id} className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{statement.text}</strong>
              <button type="button" className="secondary" onClick={() => remove(statement.id)}>
                Delete
              </button>
            </div>
            <div className="row">
              <span className="pill">Weight {statement.weight}</span>
              {statement.domain ? <span className="pill">{statement.domain}</span> : null}
              {(statement.tags || []).map((tag: string) => (
                <span key={tag} className="pill">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
