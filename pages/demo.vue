<script setup lang="ts">
import { demoRows } from '~/data/demo';
import FilterBar from '~/components/FilterBar.vue';
import DataTable from '~/components/DataTable.vue';
import ViewPicker from '~/components/ViewPicker.vue';
import SaveViewModal from '~/components/SaveViewModal.vue';
import { useDeviceKey } from '~/composables/useDeviceKey';

const route = useRoute();
const router = useRouter();
const deviceKey = useDeviceKey();

const q = ref(route.query.q?.toString() || '');
const tag = ref(route.query.tag?.toString() || '');
const status = ref(route.query.status?.toString() || '');
const sort = ref(route.query.sort?.toString() || 'updated_desc');
const pageSize = ref(Number(route.query.pageSize || 20));
const page = ref(Number(route.query.page || 1));
const columns = ref(['title', 'status', 'tag', 'updated_at']);

const showModal = ref(false);
const views = ref<any[]>([]);

const filtered = computed(() => {
  let rows = demoRows.filter((row) => {
    if (q.value && !row.title.toLowerCase().includes(q.value.toLowerCase())) return false;
    if (tag.value && row.tag !== tag.value) return false;
    if (status.value && row.status !== status.value) return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    if (sort.value === 'updated_asc') return a.updated_at.localeCompare(b.updated_at);
    return b.updated_at.localeCompare(a.updated_at);
  });
  return rows;
});

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

const updateUrl = () => {
  router.replace({
    query: {
      q: q.value || undefined,
      tag: tag.value || undefined,
      status: status.value || undefined,
      sort: sort.value,
      pageSize: pageSize.value.toString(),
      page: page.value.toString(),
    },
  });
};

watch([q, tag, status, sort, pageSize, page], updateUrl);

const loadViews = async () => {
  const { views: data } = await $fetch('/api/views', {
    query: { route: '/demo' },
    headers: { 'X-Device-Key': deviceKey },
  });
  views.value = data;
};

const saveView = async (name: string) => {
  await $fetch('/api/views', {
    method: 'POST',
    headers: { 'X-Device-Key': deviceKey },
    body: {
      name,
      route: '/demo',
      state: {
        q: q.value,
        filters: { tag: tag.value ? [tag.value] : [], status: status.value ? [status.value] : [] },
        sort: { field: 'updated_at', dir: sort.value === 'updated_desc' ? 'desc' : 'asc' },
        columns: columns.value,
        pageSize: pageSize.value,
      },
    },
  });
  await loadViews();
};

const applyView = (view: any) => {
  const state = view.state || {};
  q.value = state.q || '';
  tag.value = state.filters?.tag?.[0] || '';
  status.value = state.filters?.status?.[0] || '';
  sort.value = state.sort?.dir === 'asc' ? 'updated_asc' : 'updated_desc';
  columns.value = state.columns || columns.value;
  pageSize.value = state.pageSize || pageSize.value;
};

const deleteView = async (id: string) => {
  await $fetch(`/api/views/${id}`, {
    method: 'DELETE',
    headers: { 'X-Device-Key': deviceKey },
  });
  await loadViews();
};

onMounted(loadViews);
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1>Dataset Browser</h1>
      <p>Filter, sort, and save views to reuse later.</p>
    </header>
    <FilterBar :q="q" :tag="tag" :status="status" :sort="sort" :pageSize="pageSize" @update="(payload) => { Object.assign({ q, tag, status, sort, pageSize }, payload) }" />
    <div class="row">
      <button class="primary" @click="showModal = true">Save View</button>
      <span class="pill">{{ filtered.length }} results</span>
    </div>
    <ViewPicker :views="views" @apply="applyView" @delete="deleteView" />
    <DataTable :rows="paged" :columns="columns" />
    <SaveViewModal v-model="showModal" @save="saveView" />
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
  align-items: center;
  margin: 16px 0;
}
.pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.2);
  font-size: 12px;
}
</style>
