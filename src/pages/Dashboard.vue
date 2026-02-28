<template>
  <div class="grid grid-2">
    <section class="panel">
      <h3>Create New Page</h3>
      <div class="control">
        <label>Title</label>
        <input v-model="title" placeholder="My new page" />
      </div>
      <div class="control">
        <label>Slug</label>
        <input v-model="slug" placeholder="my-new-page" />
      </div>
      <button class="button" @click="create">Create Page</button>
      <p class="muted">{{ status }}</p>
    </section>

    <section class="panel">
      <h3>Your Pages</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in pages" :key="page.id">
            <td>{{ page.title }}</td>
            <td><span class="badge">{{ page.status }}</span></td>
            <td class="mono">{{ page.updated_at }}</td>
            <td>
              <router-link class="button secondary" :to="`/editor/${page.id}`">Edit</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { createPage, listPages } from '../core/api';

const pages = ref([] as any[]);
const title = ref('');
const slug = ref('');
const status = ref('');

async function loadPages() {
  try {
    pages.value = await listPages();
  } catch (err: any) {
    status.value = err.message;
  }
}

async function create() {
  try {
    if (!title.value || !slug.value) {
      status.value = 'Title and slug required.';
      return;
    }
    await createPage(title.value, slug.value);
    title.value = '';
    slug.value = '';
    status.value = 'Created.';
    await loadPages();
  } catch (err: any) {
    status.value = err.message;
  }
}

onMounted(loadPages);
</script>

<style scoped>
.control {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

input {
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.muted {
  color: var(--muted);
  margin-top: 0.5rem;
}
</style>
