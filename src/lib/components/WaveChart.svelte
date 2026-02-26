<script lang="ts">
  import { buildWavePath } from '$lib/charts/wave';

  export let dailyTotals: { date: string; seconds: number }[] = [];

  $: values = dailyTotals.map((d) => d.seconds);
  $: path = buildWavePath(values);
  $: max = Math.max(...values, 1);
</script>

<div class="card">
  <div class="toolbar">
    <h3>Momentum Wave</h3>
    <span class="muted">Last 7 days</span>
  </div>
  <svg viewBox="0 0 600 160" width="100%" height="160" aria-label="Momentum wave">
    <defs>
      <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#54d4a6" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#5aa2ff" stop-opacity="0.8" />
      </linearGradient>
    </defs>
    {#if path}
      <path d={path} fill="none" stroke="url(#waveGradient)" stroke-width="4" />
    {/if}
    <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.1)" />
  </svg>
  <p class="muted">Peak day: {Math.round(max / 60)} mins</p>
</div>
