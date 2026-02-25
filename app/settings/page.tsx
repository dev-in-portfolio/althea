"use client";

import { useState } from "react";
import useUserKey from "../../lib/useUserKey";

type ExportEvent = {
  id: string;
  happened_at: string;
  note: string;
  context: Record<string, string> | null;
  tags: string[];
};

export default function SettingsPage() {
  const userKey = useUserKey();
  const [status, setStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const copyKey = async () => {
    await navigator.clipboard.writeText(userKey);
    setStatus("User key copied.");
  };

  const resetKey = () => {
    window.localStorage.removeItem("radar_user_key");
    window.location.reload();
  };

  const exportData = async () => {
    if (!userKey) return;
    setStatus("Exporting...");
    let cursor: string | null = null;
    const allEvents: ExportEvent[] = [];

    while (true) {
      const params = new URLSearchParams({
        userKey,
        limit: "100"
      });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      allEvents.push(...(data.events || []));
      if (!data.nextCursor) break;
      cursor = data.nextCursor;
    }

    const blob = new Blob([JSON.stringify({ userKey, events: allEvents }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "radar-of-one-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${allEvents.length} events.`);
  };

  const importData = async (file: File | null) => {
    if (!file || !userKey) return;
    setImporting(true);
    setStatus("Importing...");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userKey, events: parsed.events || [] })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error ? `Error: ${data.error}` : "Import failed.");
      } else {
        setStatus(`Imported ${data.inserted || 0} events.`);
      }
    } catch {
      setStatus("Import failed. Check the JSON format.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="stack">
      <div className="hero">
        <h1>Settings</h1>
        <h2>Manage identity and export data.</h2>
      </div>

      <section className="panel stack">
        <div>
          <small>User key</small>
          <div className="row">
            <code>{userKey || "Loading..."}</code>
            <button type="button" className="secondary" onClick={copyKey}>
              Copy
            </button>
          </div>
        </div>

        <div className="row">
          <button type="button" onClick={exportData}>
            Export JSON
          </button>
          <button type="button" className="secondary" onClick={resetKey}>
            Reset local key
          </button>
        </div>
        <label>
          <small>Import JSON</small>
          <input
            type="file"
            accept="application/json"
            disabled={importing}
            onChange={(event) => importData(event.target.files?.[0] || null)}
          />
        </label>
        {status ? <small>{status}</small> : null}
      </section>
    </div>
  );
}
