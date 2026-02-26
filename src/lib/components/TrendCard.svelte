<script lang="ts">
  export let trendDelta = 0;
  export let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  export let smoothedVelocity = 0;

  const arrow = {
    up: '▲',
    down: '▼',
    flat: '■'
  } as const;

  $: deltaMinutes = Math.round(trendDelta / 60);
  $: smoothMinutes = Math.round(smoothedVelocity / 60);
</script>

<div class="card">
  <div class="toolbar" style="justify-content: space-between;">
    <div>
      <h3>Trend</h3>
      <p class="muted">Last 7 vs prior 7 days</p>
    </div>
    <div class="badge">{arrow[trendDirection]}</div>
  </div>
  <p class="muted" style="margin-top: 12px;">
    Delta: <strong>{deltaMinutes} mins</strong>
  </p>
  <p class="muted">
    Smoothed velocity: <strong>{smoothMinutes} mins/day</strong>
  </p>
</div>
