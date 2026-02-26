<script lang="ts">
  export let streakDays = 0;
  export let weeklySeconds = 0;
  export let flowRatio = 0;
  export let velocity = 0;

  $: weeklyMinutes = Math.round(weeklySeconds / 60);
</script>

<div class="card">
  <div class="toolbar" style="justify-content: space-between;">
    <div>
      <h3>{streakDays}</h3>
      <p class="muted">days in motion</p>
    </div>
    <div class="badge">{Math.round(flowRatio * 100)}% flow</div>
  </div>
  <p class="muted" style="margin-top: 12px;">
    Weekly total: <strong>{weeklyMinutes} mins</strong>
  </p>
  <p class="muted">
    Velocity: <strong>{Math.round(velocity / 60)} mins/day</strong>
  </p>
</div>
