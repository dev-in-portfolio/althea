<template>
  <div class="panel public">
    <h2>{{ page?.title }}</h2>
    <div v-if="!page" class="muted">Loading…</div>
    <article v-for="card in cards" :key="card.id" class="public-card">
      <h3 v-if="card.title">{{ card.title }}</h3>
      <p v-if="card.type === 'text'">{{ card.body }}</p>
      <blockquote v-else-if="card.type === 'quote'">“{{ card.body }}”</blockquote>
      <img v-else-if="card.type === 'image'" :src="card.image_url" alt="" />
      <iframe v-else-if="card.type === 'embed'" :src="card.embed_url" />
    </article>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fetchPublic } from '../core/api';
import type { Card, Page } from '../core/api';

const route = useRoute();
const page = ref<Page | null>(null);
const cards = ref<Card[]>([]);

onMounted(async () => {
  const slug = route.params.slug as string;
  try {
    const data = await fetchPublic(slug);
    page.value = data.page;
    cards.value = data.cards;
  } catch {
    page.value = null;
  }
});
</script>

<style scoped>
.public {
  max-width: 860px;
  margin: 0 auto;
}

.public-card {
  margin: 2rem 0;
}

.public-card img,
.public-card iframe {
  width: 100%;
  border-radius: 12px;
  border: none;
  min-height: 260px;
}

.muted {
  color: var(--muted);
}
</style>
