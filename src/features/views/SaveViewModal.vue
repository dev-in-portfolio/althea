<template>
  <div class="overlay" v-if="open">
    <div class="modal">
      <h3>Save View</h3>
      <p class="muted">Save this configuration as a named preset.</p>
      <input v-model="name" placeholder="View name" />
      <div class="actions">
        <button class="button" @click="save">Save</button>
        <button class="button secondary" @click="$emit('close')">Cancel</button>
      </div>
      <p class="status">{{ status }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'save', name: string): void; (e: 'close'): void }>();

const name = ref('');
const status = ref('');

function save() {
  if (!name.value.trim()) {
    status.value = 'Name required.';
    return;
  }
  emit('save', name.value.trim());
  name.value = '';
  status.value = '';
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      name.value = '';
      status.value = '';
    }
  }
);
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 16, 0.45);
  display: grid;
  place-items: center;
  z-index: 20;
}

.modal {
  background: #fff;
  padding: 1.5rem;
  border-radius: 16px;
  width: min(420px, 90vw);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

input {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  margin: 0.75rem 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.status {
  color: var(--muted);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.muted {
  color: var(--muted);
  margin-bottom: 0.5rem;
}
</style>
