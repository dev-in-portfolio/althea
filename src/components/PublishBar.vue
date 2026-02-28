<template>
  <div class="panel publish">
    <div>
      <h3>Publish</h3>
      <p class="muted">Toggle to publish and share your page.</p>
    </div>
    <div class="actions">
      <button class="button" @click="$emit('publish')" :disabled="status === 'published'">Publish</button>
      <button class="button secondary" @click="$emit('unpublish')" :disabled="status === 'draft'">Unpublish</button>
      <span v-if="publishedSlug" class="mono">/p/{{ publishedSlug }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: 'draft' | 'published'; publishedSlug?: string | null }>();
const status = computed(() => props.status);
</script>

<style scoped>
.publish {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.muted {
  color: var(--muted);
}
</style>
