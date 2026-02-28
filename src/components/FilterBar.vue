<template>
  <div class="panel filters">
    <div class="control">
      <label>Status</label>
      <select v-model="status">
        <option value="">All</option>
        <option value="ok">OK</option>
        <option value="warn">Warn</option>
        <option value="bad">Bad</option>
      </select>
    </div>
    <div class="control">
      <label>Kind</label>
      <select v-model="kind">
        <option value="">All</option>
        <option v-for="option in kinds" :key="option" :value="option">{{ option }}</option>
      </select>
    </div>
    <div class="control">
      <label>Sort</label>
      <select v-model="sort">
        <option value="severity">Severity</option>
        <option value="recent">Recent</option>
      </select>
    </div>
    <button class="button secondary" @click="emit('update', { status, kind, sort })">Apply</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ kinds: string[] }>();
const emit = defineEmits<{ (e: 'update', filters: { status: string; kind: string; sort: string }): void }>();

const status = ref('');
const kind = ref('');
const sort = ref('severity');
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 0.75rem;
  align-items: end;
}

.control {
  display: grid;
  gap: 0.4rem;
}

select {
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}
</style>
