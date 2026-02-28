<template>
  <div class="tile" :class="statusClass" @click="$emit('select')">
    <div class="header">
      <span class="kind">{{ signal.kind }}</span>
      <span class="status">{{ signal.status }}</span>
    </div>
    <h3>{{ signal.name }}</h3>
    <p class="note">{{ signal.note || '—' }}</p>
    <div class="meta">
      <span v-if="signal.value_num !== null" class="mono">
        {{ signal.value_num }} {{ signal.value_unit }}
      </span>
      <span class="mono">{{ signal.updated_at }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Signal } from '../core/api';

const props = defineProps<{ signal: Signal }>();

defineEmits<{ (e: 'select'): void }>();

const statusClass = computed(() => `status-${props.signal.status}`);
</script>

<style scoped>
.tile {
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  display: grid;
  gap: 0.5rem;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.status-ok {
  border-left: 6px solid var(--accent);
}

.status-warn {
  border-left: 6px solid var(--warn);
}

.status-bad {
  border-left: 6px solid var(--bad);
}

.header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.note {
  color: var(--muted);
  font-size: 0.85rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
}
</style>
