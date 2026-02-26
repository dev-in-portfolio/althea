<script lang="ts">
  export let weekdays: { weekday: number; seconds: number }[] = [];

  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const max = Math.max(...weekdays.map((d) => d.seconds), 1);
</script>

<div class="card">
  <div class="toolbar">
    <h3>Weekday Heat</h3>
    <span class="muted">Where momentum clusters</span>
  </div>
  <div class="weekday-grid">
    {#each weekdays as day}
      <div class="weekday-cell" style={`--alpha:${day.seconds / max}`}>
        <span>{labels[day.weekday]}</span>
        <strong>{Math.round(day.seconds / 60)}m</strong>
      </div>
    {/each}
  </div>
</div>

<style>
  .weekday-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }
  .weekday-cell {
    padding: 12px;
    border-radius: 12px;
    background: rgba(84, 212, 166, calc(0.2 + var(--alpha)));
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: grid;
    gap: 6px;
  }
  .weekday-cell span {
    color: var(--muted);
    font-size: 12px;
  }
</style>
