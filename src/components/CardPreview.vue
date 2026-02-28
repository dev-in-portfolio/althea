<template>
  <div class="panel preview">
    <h3>Live Preview</h3>
    <div class="preview-body">
      <article v-for="card in cards" :key="card.id" class="preview-card">
        <h4 v-if="card.title">{{ card.title }}</h4>
        <p v-if="card.type === 'text'">{{ card.body }}</p>
        <blockquote v-else-if="card.type === 'quote'">“{{ card.body }}”</blockquote>
        <img v-else-if="card.type === 'image'" :src="card.image_url" alt="" />
        <iframe v-else-if="card.type === 'embed'" :src="card.embed_url" />
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../core/api';

defineProps<{ cards: Card[] }>();
</script>

<style scoped>
.preview {
  min-height: 300px;
}

.preview-body {
  display: grid;
  gap: 1rem;
}

.preview-card {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.preview-card img,
.preview-card iframe {
  width: 100%;
  border-radius: 12px;
  border: none;
  min-height: 220px;
}
</style>
