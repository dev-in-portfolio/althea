<template>
  <div class="panel" v-if="card">
    <h3>Edit Card</h3>
    <div class="control">
      <label>Title</label>
      <input v-model="draft.title" />
    </div>
    <div class="control" v-if="card.type === 'text' || card.type === 'quote'">
      <label>Body</label>
      <textarea v-model="draft.body" rows="8" />
    </div>
    <div class="control" v-if="card.type === 'image'">
      <label>Image URL</label>
      <input v-model="draft.image_url" />
    </div>
    <div class="control" v-if="card.type === 'embed'">
      <label>Embed URL</label>
      <input v-model="draft.embed_url" />
    </div>
    <div class="actions">
      <button class="button" @click="save">Save</button>
      <button class="button secondary" @click="$emit('delete')">Delete</button>
      <span class="muted">{{ status }}</span>
    </div>
  </div>
  <div v-else class="panel">
    <p class="muted">Select a card to edit.</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from 'vue';
import type { Card } from '../core/api';

const props = defineProps<{ card: Card | null }>();
const emit = defineEmits<{ (e: 'save', payload: Partial<Card>): void; (e: 'delete'): void }>();

const draft = reactive({
  title: '',
  body: '',
  image_url: '',
  embed_url: '',
});
const status = ref('');

watch(
  () => props.card,
  (card) => {
    status.value = '';
    if (!card) return;
    draft.title = card.title;
    draft.body = card.body;
    draft.image_url = card.image_url;
    draft.embed_url = card.embed_url;
  },
  { immediate: true }
);

function save() {
  emit('save', { ...draft });
  status.value = 'Saved';
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
  width: 100%;
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.muted {
  color: var(--muted);
  font-size: 0.8rem;
}
</style>
