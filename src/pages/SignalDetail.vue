<template>
  <div class="grid grid-2">
    <section class="panel" v-if="signal">
      <h3>Signal Detail</h3>
      <div class="control">
        <label>Name</label>
        <input v-model="draft.name" />
      </div>
      <div class="control">
        <label>Kind</label>
        <input v-model="draft.kind" />
      </div>
      <div class="control">
        <label>Note</label>
        <textarea v-model="draft.note" rows="4" />
      </div>
      <div class="grid grid-2">
        <div class="control">
          <label>Value</label>
          <input v-model.number="draft.value_num" type="number" />
        </div>
        <div class="control">
          <label>Unit</label>
          <input v-model="draft.value_unit" />
        </div>
      </div>
      <div class="actions">
        <button class="button" @click="save">Save</button>
        <span class="mono">Updated: {{ signal.updated_at }}</span>
      </div>
    </section>

    <RuleEditor :rule="rule" @save="saveRule" @clear="clearRule" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import RuleEditor from '../components/RuleEditor.vue';
import { getRule, listSignals, updateSignal, upsertRule, deleteRule } from '../core/api';
import type { Signal, Rule } from '../core/api';

const route = useRoute();
const signal = ref<Signal | null>(null);
const rule = ref<Rule | null>(null);

const draft = reactive({
  name: '',
  kind: '',
  note: '',
  value_num: null as number | null,
  value_unit: '',
});

async function load() {
  const id = route.params.id as string;
  const signals = await listSignals();
  signal.value = signals.find((s) => s.id === id) || null;
  if (signal.value) {
    draft.name = signal.value.name;
    draft.kind = signal.value.kind;
    draft.note = signal.value.note;
    draft.value_num = signal.value.value_num;
    draft.value_unit = signal.value.value_unit;
  }
  rule.value = await getRule(id);
}

async function save() {
  if (!signal.value) return;
  signal.value = await updateSignal(signal.value.id, { ...draft });
}

async function saveRule(payload: Rule) {
  if (!signal.value) return;
  rule.value = await upsertRule(signal.value.id, payload);
}

async function clearRule() {
  if (!signal.value) return;
  await deleteRule(signal.value.id);
  rule.value = null;
}

onMounted(load);
</script>

<style scoped>
.control {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

input,
textarea {
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
