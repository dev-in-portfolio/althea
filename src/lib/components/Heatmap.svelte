<script lang="ts">
  import { splitWeeks, type HeatmapCell } from '$lib/charts/heatmap';

  export let cells: HeatmapCell[] = [];
  $: weeks = splitWeeks(cells);

  const levels = ['rgba(84, 212, 166, 0.15)', 'rgba(84, 212, 166, 0.35)', 'rgba(84, 212, 166, 0.55)', 'rgba(84, 212, 166, 0.75)', 'rgba(84, 212, 166, 0.95)'];
</script>

<div class="card">
  <div class="toolbar">
    <h3>Heatmap</h3>
    <span class="muted">Last 30 days</span>
  </div>
  <div class="heatmap">
    {#each weeks as week}
      <div class="heatmap-col">
        {#each week as cell}
          <div
            class="heatmap-cell"
            style={`background:${levels[cell.level]}`}
            title={`${cell.date} · Level ${cell.level}`}
          ></div>
        {/each}
      </div>
    {/each}
  </div>
  <div class="toolbar" style="margin-top: 12px;">
    <span class="muted">Low</span>
    {#each levels as level}
      <span class="legend" style={`background:${level}`}></span>
    {/each}
    <span class="muted">High</span>
  </div>
</div>

<style>
  .heatmap {
    display: grid;
    grid-auto-flow: column;
    gap: 6px;
    margin-top: 16px;
  }
  .heatmap-col {
    display: grid;
    grid-template-rows: repeat(7, 18px);
    gap: 6px;
  }
  .heatmap-cell {
    width: 18px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
  }
  .legend {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    margin: 0 4px;
  }
</style>
