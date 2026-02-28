import TestHarness from "../islands/TestHarness.tsx";

export default function TestPage() {
  return (
    <div class="page">
      <header class="hero">
        <h1>Test Harness</h1>
        <p>Run payloads against your ruleset and capture the outcome.</p>
      </header>
      <TestHarness />
    </div>
  );
}
