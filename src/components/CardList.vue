<template>
  <div class="panel">
    <div class="list-header">
      <h3>Cards</h3>
      <button class="button secondary" @click="$emit('add-card')">Add Card</button>
    </div>
    <ul class="card-list">
      <li
        v-for="card in cards"
        :key="card.id"
        :class="['card-item', selectedId === card.id ? 'active' : '']"
        @click="$emit('select', card.id)"
      >
        <div>
          <p class="mono">{{ card.type.toUpperCase() }}</p>
          <h4>{{ card.title || 'Untitled' }}</h4>
          <p class="muted">{{ card.body.slice(0, 80) }}{{ card.body.length > 80 ? '…' : '' }}</p>
        </div>
        <div class="actions">
          <button class="button ghost" @click.stop="$emit('move-up', card.id)">↑</button>
          <button class="button ghost" @click.stop="$emit('move-down', card.id)">↓</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../core/api';

defineProps<{ cards: Card[]; selectedId: string | null }>();

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'add-card'): void;
  (e: 'move-up', id: string): void;
  (e: 'move-down', id: string): void;
}>();
</script>

<style scoped>
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: grid;
  gap: 0.75rem;
}

.card-item {
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.card-item.active {
  border-color: var(--accent);
  box-shadow: 0 12px 24px rgba(255, 127, 80, 0.18);
}

.actions {
  display: grid;
  gap: 0.4rem;
}

.muted {
  color: var(--muted);
  font-size: 0.8rem;
  margin: 0.25rem 0 0;
}
</style>
