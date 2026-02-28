import { useState } from "preact/hooks";

export default function TestHarness() {
  const [input, setInput] = useState('{\n  "metrics": { "latency_ms": 350 }\n}');
  const [result, setResult] = useState("");

  const run = async () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(input);
    } catch {
      setResult("Invalid JSON input.");
      return;
    }
    const res = await fetch("/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: parsed }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <section class="panel">
      <textarea value={input} onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)} rows={10} />
      <div class="actions">
        <button class="button" onClick={run}>
          Run Test
        </button>
      </div>
      <pre class="code">{result}</pre>
    </section>
  );
}
