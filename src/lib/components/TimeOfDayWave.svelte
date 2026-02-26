<script lang="ts">
  import { buildWavePath } from '$lib/charts/wave';

  export let hourly: { hour: number; seconds: number }[] = [];

  $: values = hourly.map((d) => d.seconds);
  $: path = buildWavePath(values, 600, 140);
</script>

<div class="card">
  <div class="toolbar">
    <h3>Time-of-Day Wave</h3>
    <span class="muted">Peak focus hours</span>
  </div>
  <svg viewBox="0 0 600 140" width="100%" height="140" aria-label="Time of day wave">
    <defs>
      <linearGradient id="todGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#5aa2ff" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#54d4a6" stop-opacity="0.8" />
      </linearGradient>
    </defs>
    {#if path}
      <path d={path} fill="none" stroke="url(#todGradient)" stroke-width="4" />
    {/if}
    <line x1="0" y1="130" x2="600" y2="130" stroke="rgba(255,255,255,0.1)" />
  </svg>
  <p class="muted">Morning to night distribution</p>
</div>
