<script setup lang="ts">
import { useDeviceKey } from '~/composables/useDeviceKey';

const deviceKey = useDeviceKey();
const views = ref<any[]>([]);

const load = async () => {
  const { views: data } = await $fetch('/api/views', {
    query: { route: '/' },
    headers: { 'X-Device-Key': deviceKey },
  });
  views.value = data;
};

const deleteView = async (id: string) => {
  await $fetch(`/api/views/${id}`, {
    method: 'DELETE',
    headers: { 'X-Device-Key': deviceKey },
  });
  await load();
};

onMounted(load);
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1>View Vault</h1>
      <p>Manage saved views across routes.</p>
    </header>
    <div class="grid">
      <div v-for="view in views" :key="view.id" class="card">
        <h3>{{ view.name }}</h3>
        <p class="muted">Route {{ view.route }}</p>
        <pre>{{ view.state }}</pre>
        <div class="actions">
          <button class="danger" @click="deleteView(view.id)">Delete</button>
        </div>
      </div>
    </div>
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
  margin-top: 12px;
}
</style>
