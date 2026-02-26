<script lang="ts">
  import WaveChart from '$lib/components/WaveChart.svelte';
  import Heatmap from '$lib/components/Heatmap.svelte';
  import StreakCard from '$lib/components/StreakCard.svelte';
  import TrendCard from '$lib/components/TrendCard.svelte';
  import SignalsCard from '$lib/components/SignalsCard.svelte';
  import TimeOfDayWave from '$lib/components/TimeOfDayWave.svelte';
  import WeekdayHeatmap from '$lib/components/WeekdayHeatmap.svelte';

  export let data: { metrics: any | null };
  const metrics = data.metrics;
</script>

<main class="grid">
  <div class="card">
    <h1>Dashboard</h1>
    <p class="muted">Visualize your energy rhythm and streaks.</p>
    {#if !metrics}
      <p class="muted">Metrics unavailable. Check DB connection.</p>
    {/if}
  </div>

  {#if metrics}
    <div class="split">
      <WaveChart dailyTotals={metrics.dailyTotals} />
      <StreakCard
        streakDays={metrics.streakDays}
        weeklySeconds={metrics.weeklySeconds}
        velocity={metrics.velocity}
        flowRatio={metrics.flowRatio}
      />
    </div>
    <div class="split">
      <TrendCard
        trendDelta={metrics.trendDelta}
        trendDirection={metrics.trendDirection}
        smoothedVelocity={metrics.smoothedVelocity}
      />
      <SignalsCard flowStreak={metrics.flowStreak} dragAlert={metrics.dragAlert} />
    </div>
    <Heatmap cells={metrics.heatmap} />
    <div class="split">
      <TimeOfDayWave hourly={metrics.hourlyWave} />
      <WeekdayHeatmap weekdays={metrics.weekdayHeatmap} />
    </div>
  {/if}
</main>
