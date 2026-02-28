<template>
  <div class="panel">
    <h3>Quick Update</h3>
    <div class="control">
      <label>Note</label>
      <textarea v-model="note" rows="4" />
    </div>
    <div class="grid grid-2">
      <div class="control">
        <label>Value</label>
        <input v-model.number="value_num" type="number" />
      </div>
      <div class="control">
        <label>Unit</label>
        <input v-model="value_unit" />
      </div>
    </div>
    <div class="actions">
      <button class="button" @click="save">Save</button>
      <button class="button secondary" @click="setStatus('ok')">OK</button>
      <button class="button secondary" @click="setStatus('warn')">Warn</button>
      <button class="button secondary" @click="setStatus('bad')">Bad</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Signal } from '../core/api';

const props = defineProps<{ signal: Signal | null }>();
const emit = defineEmits<{ (e: 'save', payload: Partial<Signal>): void }>();

const note = ref('');
const value_num = ref<number | null>(null);
const value_unit = ref('');

watch(
  () => props.signal,
  (signal) => {
    note.value = signal?.note || '';
    value_num.value = signal?.value_num ?? null;
    value_unit.value = signal?.value_unit || '';
  },
  { immediate: true }
);

function save() {
  emit('save', { note: note.value, value_num: value_num.value, value_unit: value_unit.value });
}

function setStatus(status: 'ok' | 'warn' | 'bad') {
  emit('save', { status });
}
</script>

<style scoped>
.control {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

input,
textarea {
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
