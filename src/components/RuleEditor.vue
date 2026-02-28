<template>
  <div class="panel">
    <h3>Alert Rules</h3>
    <div class="grid grid-2">
      <div class="control">
        <label>Warn if &gt;</label>
        <input v-model.number="draft.warn_if_gt" type="number" />
      </div>
      <div class="control">
        <label>Warn if &lt;</label>
        <input v-model.number="draft.warn_if_lt" type="number" />
      </div>
      <div class="control">
        <label>Bad if &gt;</label>
        <input v-model.number="draft.bad_if_gt" type="number" />
      </div>
      <div class="control">
        <label>Bad if &lt;</label>
        <input v-model.number="draft.bad_if_lt" type="number" />
      </div>
    </div>
    <div class="actions">
      <button class="button" @click="$emit('save', draft)">Save Rules</button>
      <button class="button secondary" @click="$emit('clear')">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { Rule } from '../core/api';

const props = defineProps<{ rule: Rule | null }>();

defineEmits<{ (e: 'save', rule: Rule): void; (e: 'clear'): void }>();

const draft = reactive<Rule>({
  warn_if_gt: null,
  warn_if_lt: null,
  bad_if_gt: null,
  bad_if_lt: null,
});

watch(
  () => props.rule,
  (rule) => {
    draft.warn_if_gt = rule?.warn_if_gt ?? null;
    draft.warn_if_lt = rule?.warn_if_lt ?? null;
    draft.bad_if_gt = rule?.bad_if_gt ?? null;
    draft.bad_if_lt = rule?.bad_if_lt ?? null;
  },
  { immediate: true }
);
</script>

<style scoped>
.control {
  display: grid;
  gap: 0.4rem;
}

input {
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
</style>
