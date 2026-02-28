<script setup lang="ts">
import { useDeviceKey } from '~/composables/useDeviceKey';

const deviceKey = useDeviceKey();
const pages = ref<any[]>([]);
const title = ref('');
const slug = ref('');

const load = async () => {
  const { pages: data } = await $fetch('/api/cardpress/pages', {
    headers: { 'X-Device-Key': deviceKey },
  });
  pages.value = data;
};

const create = async () => {
  if (!title.value || !slug.value) return;
  await $fetch('/api/cardpress/pages', {
    method: 'POST',
    headers: { 'X-Device-Key': deviceKey },
    body: { title: title.value, slug: slug.value },
  });
  title.value = '';
  slug.value = '';
  await load();
};

onMounted(load);
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1>CardPress Dashboard</h1>
      <p>Create and publish card-driven pages.</p>
    </header>
    <section class="panel">
      <h2>New Page</h2>
      <div class="row">
        <input v-model="title" placeholder="Title" />
        <input v-model="slug" placeholder="slug" />
        <button class="primary" @click="create">Create</button>
      </div>
    </section>
    <section class="grid">
      <article v-for="page in pages" :key="page.id" class="card">
        <h3>{{ page.title }}</h3>
        <p class="muted">/{{ page.slug }}</p>
        <p class="muted">Status: {{ page.status }}</p>
        <div class="actions">
          <NuxtLink class="ghost" :to="`/edit/${page.id}`">Edit</NuxtLink>
          <NuxtLink v-if="page.published_slug" class="ghost" :to="`/p/${page.published_slug}`">Public</NuxtLink>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}
.hero h1 {
  margin: 0 0 8px;
  font-size: clamp(28px, 4vw, 40px);
}
.hero p {
  color: #94a3b8;
}
.row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
.card {
  background: rgba(15, 23, 42, 0.75);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
</style>
