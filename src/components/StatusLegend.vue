<template>
  <div class="panel legend">
    <h3>Status Legend</h3>
    <div class="row">
      <span class="dot ok"></span> OK
      <span class="dot warn"></span> Warn
      <span class="dot bad"></span> Bad
    </div>
  </div>
</template>

<style scoped>
.legend {
  display: grid;
  gap: 0.5rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.ok {
  background: var(--accent);
}

.warn {
  background: var(--warn);
}

.bad {
  background: var(--bad);
}
</style>
