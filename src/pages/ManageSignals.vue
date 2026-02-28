<template>
  <div class="grid grid-2">
    <section class="panel">
      <h3>Bulk Create</h3>
      <p class="muted">Paste one signal per line. Optional format: name | kind</p>
      <textarea v-model="bulk" rows="8" placeholder="Latency | api\nQueue Depth | job" />
      <button class="button" @click="bulkCreate">Create</button>
      <p class="muted">{{ status }}</p>
    </section>

    <section class="panel">
      <h3>Bulk Delete</h3>
      <p class="muted">Filter by status or kind to delete matching signals.</p>
      <div class="control">
        <label>Status</label>
        <select v-model="deleteStatus">
          <option value="">All</option>
          <option value="ok">OK</option>
          <option value="warn">Warn</option>
          <option value="bad">Bad</option>
        </select>
      </div>
      <div class="control">
        <label>Kind</label>
        <input v-model="deleteKind" placeholder="api, job, project" />
      </div>
      <button class="button secondary" @click="bulkDelete">Delete Matching</button>
      <p class="muted">{{ deleteStatusMsg }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createSignal, deleteSignal, listSignals } from '../core/api';

const bulk = ref('');
const status = ref('');
const deleteStatus = ref('');
const deleteKind = ref('');
const deleteStatusMsg = ref('');

async function bulkCreate() {
  const lines = bulk.value.split('\n').map((l) => l.trim()).filter(Boolean);
  let created = 0;
  for (const line of lines) {
    const [name, kind] = line.split('|').map((part) => part.trim());
    if (!name) continue;
    await createSignal({ name, kind: kind || 'generic' });
    created += 1;
  }
  status.value = `Created ${created} signals.`;
  bulk.value = '';
}

async function bulkDelete() {
  const signals = await listSignals();
  const filtered = signals.filter((s) => {
    const statusMatch = deleteStatus.value ? s.status === deleteStatus.value : true;
    const kindMatch = deleteKind.value ? s.kind === deleteKind.value : true;
    return statusMatch && kindMatch;
  });
  for (const signal of filtered) {
    await deleteSignal(signal.id);
  }
  deleteStatusMsg.value = `Deleted ${filtered.length} signals.`;
}
</script>

<style scoped>
textarea {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  margin-bottom: 0.75rem;
}

.control {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

input,
select {
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.muted {
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
