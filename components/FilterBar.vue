<script setup lang="ts">
const props = defineProps<{
  q: string;
  tag: string;
  status: string;
  sort: string;
  pageSize: number;
}>();

const emit = defineEmits<{
  (event: 'update', payload: Record<string, string | number>): void;
}>();
</script>

<template>
  <div class="panel filter-bar">
    <input v-model="props.q" placeholder="Search title" @input="emit('update', { q: props.q })" />
    <select v-model="props.tag" @change="emit('update', { tag: props.tag })">
      <option value="">All tags</option>
      <option value="core">core</option>
      <option value="edge">edge</option>
      <option value="vault">vault</option>
      <option value="signal">signal</option>
      <option value="ops">ops</option>
    </select>
    <select v-model="props.status" @change="emit('update', { status: props.status })">
      <option value="">All status</option>
      <option value="open">open</option>
      <option value="closed">closed</option>
      <option value="blocked">blocked</option>
    </select>
    <select v-model="props.sort" @change="emit('update', { sort: props.sort })">
      <option value="updated_desc">Newest</option>
      <option value="updated_asc">Oldest</option>
    </select>
    <select v-model.number="props.pageSize" @change="emit('update', { pageSize: props.pageSize })">
      <option :value="10">10</option>
      <option :value="20">20</option>
      <option :value="50">50</option>
    </select>
  </div>
</template>

<style scoped>
.filter-bar {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
</style>
