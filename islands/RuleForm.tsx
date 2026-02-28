import { useEffect, useState } from "preact/hooks";

type Rule = {
  id: string;
  name: string;
  priority: number;
  is_enabled: boolean;
  when_expr: string;
  then_json: Record<string, unknown>;
};

export default function RuleForm({ rule }: { rule?: Rule }) {
  const [name, setName] = useState(rule?.name ?? "");
  const [priority, setPriority] = useState(rule?.priority ?? 0);
  const [enabled, setEnabled] = useState(rule?.is_enabled ?? true);
  const [whenExpr, setWhenExpr] = useState(rule?.when_expr ?? "");
  const [thenJson, setThenJson] = useState(JSON.stringify(rule?.then_json ?? {}, null, 2));
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(rule?.name ?? "");
    setPriority(rule?.priority ?? 0);
    setEnabled(rule?.is_enabled ?? true);
    setWhenExpr(rule?.when_expr ?? "");
    setThenJson(JSON.stringify(rule?.then_json ?? {}, null, 2));
  }, [rule]);

  const save = async () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(thenJson || "{}");
    } catch {
      setMessage("Invalid JSON in outcome.");
      return;
    }
    const payload = {
      name,
      priority,
      is_enabled: enabled,
      when_expr: whenExpr,
      then_json: parsed,
    };
    const url = rule ? `/api/rules/${rule.id}` : "/api/rules";
    const method = rule ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("Saved.");
    } else {
      const err = await res.json();
      setMessage(err.error ?? "Failed to save.");
    }
  };

  const remove = async () => {
    if (!rule) return;
    await fetch(`/api/rules/${rule.id}`, { method: "DELETE" });
    window.location.assign("/");
  };

  return (
    <section class="panel">
      <div class="grid">
        <input value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Rule name" />
        <input
          type="number"
          value={priority}
          onInput={(e) => setPriority(Number((e.target as HTMLInputElement).value))}
          placeholder="Priority"
        />
      </div>
      <label class="row">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled((e.target as HTMLInputElement).checked)} />
        Enabled
      </label>
      <textarea value={whenExpr} onInput={(e) => setWhenExpr((e.target as HTMLTextAreaElement).value)} rows={3} />
      <textarea value={thenJson} onInput={(e) => setThenJson((e.target as HTMLTextAreaElement).value)} rows={6} />
      <div class="actions">
        <button class="button" onClick={save}>
          Save Rule
        </button>
        {rule ? (
          <button class="button danger" onClick={remove}>
            Delete
          </button>
        ) : null}
        <span class="muted">{message}</span>
      </div>
    </section>
  );
}
