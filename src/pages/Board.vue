<template>
  <div class="grid">
    <FilterBar :kinds="kinds" @update="applyFilters" />
    <StatusLegend />

    <section class="grid grid-3">
      <SignalTile
        v-for="signal in filtered"
        :key="signal.id"
        :signal="signal"
        @select="select(signal.id)"
      />
    </section>

    <InlineNoteEditor :signal="selected" @save="updateSelected" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FilterBar from '../components/FilterBar.vue';
import StatusLegend from '../components/StatusLegend.vue';
import SignalTile from '../components/SignalTile.vue';
import InlineNoteEditor from '../components/InlineNoteEditor.vue';
import { fetchBoard, updateSignal } from '../core/api';
import type { Signal } from '../core/api';

const signals = ref<Signal[]>([]);
const selectedId = ref<string | null>(null);

const filters = ref({ status: '', kind: '', sort: 'severity' });

const kinds = computed(() => {
  const set = new Set(signals.value.map((s) => s.kind));
  return Array.from(set);
});

const filtered = computed(() => {
  let rows = [...signals.value];
  if (filters.value.status) {
    rows = rows.filter((s) => s.status === filters.value.status);
  }
  if (filters.value.kind) {
    rows = rows.filter((s) => s.kind === filters.value.kind);
  }
  if (filters.value.sort === 'recent') {
    rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  } else {
    const order = { bad: 0, warn: 1, ok: 2 } as const;
    rows.sort((a, b) => order[a.status] - order[b.status]);
  }
  return rows;
});

const selected = computed(() => signals.value.find((s) => s.id === selectedId.value) || null);

function select(id: string) {
  selectedId.value = id;
}

async function updateSelected(payload: Partial<Signal>) {
  if (!selectedId.value) return;
  const updated = await updateSignal(selectedId.value, payload);
  signals.value = signals.value.map((s) => (s.id === updated.id ? updated : s));
}

function applyFilters(next: { status: string; kind: string; sort: string }) {
  filters.value = next;
}

onMounted(async () => {
  signals.value = await fetchBoard();
  selectedId.value = signals.value[0]?.id ?? null;
});
</script>
