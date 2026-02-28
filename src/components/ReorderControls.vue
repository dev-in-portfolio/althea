<template>
  <div class="panel reorder">
    <h3>Order Controls</h3>
    <p class="muted">Use the buttons in the list to move cards up or down.</p>
    <div class="legend">
      <span class="badge">↑ Move up</span>
      <span class="badge">↓ Move down</span>
    </div>
  </div>
</template>

<style scoped>
.reorder {
  text-align: center;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.muted {
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
