<script lang="ts">
  import '../app.css';
</script>

<svelte:head>
  <title>Momentum</title>
  <meta name="description" content="Track focus energy and flow velocity with Momentum." />
  <meta property="og:title" content="Momentum" />
  <meta property="og:description" content="Track focus energy and flow velocity with Momentum." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/og.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="/og.svg" />
</svelte:head>

<nav class="card" style="margin: 24px auto 0; max-width: 1100px;">
  <div class="toolbar">
    <strong>Momentum</strong>
    <a class="btn secondary" href="/">Focus</a>
    <a class="btn secondary" href="/dashboard">Dashboard</a>
    <a class="btn secondary" href="/history">History</a>
  </div>
</nav>

<slot />
