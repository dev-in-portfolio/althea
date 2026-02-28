<template>
  <div class="grid grid-3">
    <ViewPicker
      :route="routePath"
      :current-state="state"
      @apply="applyState"
      @open-save="openSave = true"
    />

    <section class="panel">
      <h3>Filters & Sorting</h3>
      <div class="control">
        <label>Search</label>
        <input v-model="state.q" placeholder="Search titles or content" />
      </div>
      <div class="control">
        <label>Status</label>
        <div class="chip-group">
          <button
            v-for="item in statusOptions"
            :key="item"
            :class="['chip', state.filters.status?.includes(item) ? 'active' : '']"
            @click="toggleFilter('status', item)"
          >
            {{ item }}
          </button>
        </div>
      </div>
      <div class="control">
        <label>Tag</label>
        <div class="chip-group">
          <button
            v-for="item in tagOptions"
            :key="item"
            :class="['chip', state.filters.tag?.includes(item) ? 'active' : '']"
            @click="toggleFilter('tag', item)"
          >
            {{ item }}
          </button>
        </div>
      </div>
      <div class="control">
        <label>Sort</label>
        <select v-model="state.sort.field">
          <option value="updated_at">Updated</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
        </select>
        <select v-model="state.sort.dir">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
      <div class="control">
        <label>Columns</label>
        <div class="chip-group">
          <button
            v-for="col in columnOptions"
            :key="col"
            :class="['chip', state.columns.includes(col) ? 'active' : '']"
            @click="toggleColumn(col)"
          >
            {{ col }}
          </button>
        </div>
      </div>
      <div class="control">
        <label>Page Size</label>
        <input type="range" min="5" max="50" step="5" v-model.number="state.pageSize" />
        <span class="muted">{{ state.pageSize }} rows</span>
      </div>
      <div class="control actions">
        <button class="button" @click="openSave = true">Save View</button>
        <button class="button secondary" @click="copyShare">Copy Share URL</button>
        <span class="muted">{{ shareStatus }}</span>
      </div>
    </section>

    <section class="panel">
      <h3>Results</h3>
      <table class="table">
        <thead>
          <tr>
            <th v-for="col in state.columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paged" :key="row.id">
            <td v-for="col in state.columns" :key="col">
              <span v-if="col === 'tag'" class="badge">{{ row.tag }}</span>
              <span v-else-if="col === 'updated_at'" class="mono">{{ row.updated_at }}</span>
              <span v-else>{{ row[col] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="button secondary" @click="page = Math.max(1, page - 1)">Prev</button>
        <span class="mono">Page {{ page }} / {{ totalPages }}</span>
        <button class="button secondary" @click="page = Math.min(totalPages, page + 1)">Next</button>
      </div>
    </section>

    <SaveViewModal
      :open="openSave"
      @save="saveView"
      @close="openSave = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ViewPicker from '../features/views/ViewPicker.vue';
import SaveViewModal from '../features/views/SaveViewModal.vue';
import { createView, fetchShare } from '../core/api';
import type { ViewState } from '../core/api';

const router = useRouter();
const route = useRoute();
const routePath = route.path;

const defaultState: ViewState = {
  q: '',
  filters: { tag: [], status: [] },
  sort: { field: 'updated_at', dir: 'desc' },
  columns: ['title', 'status', 'tag', 'updated_at'],
  pageSize: 15,
};

const state = ref<ViewState>({ ...defaultState });
const openSave = ref(false);
const shareStatus = ref('');

const dataset = ref([
  { id: 1, title: 'Exhibit Lighting Plan', status: 'open', tag: 'ops', updated_at: '2026-02-20', owner: 'Aria' },
  { id: 2, title: 'Gallery Motion Sensors', status: 'review', tag: 'safety', updated_at: '2026-02-18', owner: 'Kai' },
  { id: 3, title: 'Audio Tour Script', status: 'done', tag: 'content', updated_at: '2026-02-12', owner: 'Nova' },
  { id: 4, title: 'Wayfinding Signage', status: 'open', tag: 'design', updated_at: '2026-02-10', owner: 'Ivy' },
  { id: 5, title: 'Archive Label Taxonomy', status: 'review', tag: 'taxonomy', updated_at: '2026-02-06', owner: 'Aiden' },
  { id: 6, title: 'Interactive Kiosk Patch', status: 'done', tag: 'ops', updated_at: '2026-02-01', owner: 'Lena' },
  { id: 7, title: 'Visitor Flow Draft', status: 'open', tag: 'planning', updated_at: '2026-01-28', owner: 'Zoe' },
  { id: 8, title: 'Ingress Monitoring', status: 'review', tag: 'safety', updated_at: '2026-01-25', owner: 'Raj' },
]);

const statusOptions = ['open', 'review', 'done'];
const tagOptions = ['ops', 'safety', 'content', 'design', 'taxonomy', 'planning'];
const columnOptions = ['title', 'status', 'tag', 'updated_at', 'owner'];

const page = ref(1);

const filtered = computed(() => {
  let rows = [...dataset.value];
  if (state.value.q) {
    const q = state.value.q.toLowerCase();
    rows = rows.filter((row) => row.title.toLowerCase().includes(q));
  }
  if (state.value.filters.status?.length) {
    rows = rows.filter((row) => state.value.filters.status?.includes(row.status));
  }
  if (state.value.filters.tag?.length) {
    rows = rows.filter((row) => state.value.filters.tag?.includes(row.tag));
  }
  rows.sort((a, b) => {
    const dir = state.value.sort.dir === 'asc' ? 1 : -1;
    const field = state.value.sort.field as keyof typeof a;
    if (a[field] < b[field]) return -1 * dir;
    if (a[field] > b[field]) return 1 * dir;
    return 0;
  });
  return rows;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / state.value.pageSize)));
const paged = computed(() => {
  const start = (page.value - 1) * state.value.pageSize;
  return filtered.value.slice(start, start + state.value.pageSize);
});

function toggleFilter(key: 'status' | 'tag', value: string) {
  const list = state.value.filters[key] || [];
  if (list.includes(value)) {
    state.value.filters[key] = list.filter((item) => item !== value);
  } else {
    state.value.filters[key] = [...list, value];
  }
  page.value = 1;
}

function toggleColumn(col: string) {
  if (state.value.columns.includes(col)) {
    state.value.columns = state.value.columns.filter((c) => c !== col);
  } else {
    state.value.columns = [...state.value.columns, col];
  }
}

function applyState(newState: ViewState) {
  state.value = JSON.parse(JSON.stringify(newState));
  page.value = 1;
}

async function saveView(name: string) {
  try {
    await createView(name, routePath, state.value);
    openSave.value = false;
    shareStatus.value = 'View saved.';
  } catch (err: any) {
    shareStatus.value = err.message;
  }
}

async function copyShare() {
  try {
    const url = new URL(window.location.href);
    await navigator.clipboard.writeText(url.toString());
    shareStatus.value = 'URL copied.';
  } catch {
    shareStatus.value = 'Copy failed.';
  }
}

function syncFromQuery() {
  const q = route.query.q as string | undefined;
  const tag = route.query.tag as string | undefined;
  const status = route.query.status as string | undefined;
  const sort = route.query.sort as string | undefined;
  const dir = route.query.dir as string | undefined;
  const cols = route.query.cols as string | undefined;
  const pageSize = route.query.pageSize as string | undefined;

  state.value.q = q || '';
  state.value.filters.tag = tag ? tag.split(',') : [];
  state.value.filters.status = status ? status.split(',') : [];
  state.value.sort.field = sort || 'updated_at';
  state.value.sort.dir = dir === 'asc' ? 'asc' : 'desc';
  state.value.columns = cols ? cols.split(',') : [...defaultState.columns];
  state.value.pageSize = pageSize ? Number(pageSize) : defaultState.pageSize;
}

function syncToQuery() {
  router.replace({
    query: {
      q: state.value.q || undefined,
      tag: state.value.filters.tag?.length ? state.value.filters.tag.join(',') : undefined,
      status: state.value.filters.status?.length ? state.value.filters.status.join(',') : undefined,
      sort: state.value.sort.field,
      dir: state.value.sort.dir,
      cols: state.value.columns.join(','),
      pageSize: String(state.value.pageSize),
    },
  });
}

onMounted(async () => {
  syncFromQuery();
  const shareId = route.query.share as string | undefined;
  if (shareId) {
    try {
      const view = await fetchShare(shareId);
      applyState(view.state);
    } catch {
      shareStatus.value = 'Share not found.';
    }
  }
});

watch(state, () => {
  syncToQuery();
}, { deep: true });
</script>

<style scoped>
.control {
  margin-bottom: 1rem;
  display: grid;
  gap: 0.4rem;
}

.control label {
  font-weight: 600;
}

input, select {
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  border: 1px solid var(--border);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}

.chip.active {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.muted {
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
