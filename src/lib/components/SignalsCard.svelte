<script lang="ts">
  export let flowStreak = 0;
  export let dragAlert = false;
</script>

<div class="card">
  <div class="toolbar" style="justify-content: space-between;">
    <h3>Signals</h3>
    {#if dragAlert}
      <span class="badge" style="background: rgba(255, 107, 107, 0.2); color: var(--danger);">Drag spike</span>
    {:else}
      <span class="badge">Stable</span>
    {/if}
  </div>
  <p class="muted" style="margin-top: 12px;">
    Flow streak: <strong>{flowStreak} days</strong>
  </p>
  <p class="muted">Drag alert triggers after 3 drag sessions in 7 days.</p>
</div>
