<template>
  <div class="grid grid-3">
    <CardList
      :cards="cards"
      :selected-id="selectedId"
      @select="selectCard"
      @add-card="addNewCard"
      @move-up="moveCard"
      @move-down="moveCardDown"
    />

    <CardEditorPanel
      :card="selectedCard"
      @save="saveCard"
      @delete="removeCard"
    />

    <div class="grid">
      <PublishBar
        :status="page?.status || 'draft'"
        :published-slug="page?.published_slug"
        @publish="publish"
        @unpublish="unpublish"
      />
      <ReorderControls />
      <CardPreview :cards="cards" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import CardList from '../components/CardList.vue';
import CardEditorPanel from '../components/CardEditorPanel.vue';
import CardPreview from '../components/CardPreview.vue';
import ReorderControls from '../components/ReorderControls.vue';
import PublishBar from '../components/PublishBar.vue';
import { addCard, deleteCard, fetchPage, updateCard, updatePage } from '../core/api';
import type { Card, CardType, Page } from '../core/api';

const route = useRoute();
const page = ref<Page | null>(null);
const cards = ref<Card[]>([]);
const selectedId = ref<string | null>(null);

const selectedCard = computed(() => cards.value.find((c) => c.id === selectedId.value) || null);

async function load() {
  const id = route.params.id as string;
  const data = await fetchPage(id);
  page.value = data.page;
  cards.value = data.cards;
  selectedId.value = cards.value[0]?.id ?? null;
}

function selectCard(id: string) {
  selectedId.value = id;
}

async function addNewCard() {
  if (!page.value) return;
  const ord = cards.value.length ? Math.max(...cards.value.map((c) => c.ord)) + 1 : 1;
  const type: CardType = 'text';
  const card = await addCard(page.value.id, { type, ord, title: 'New card', body: '' });
  cards.value.push(card);
  selectedId.value = card.id;
}

async function saveCard(payload: Partial<Card>) {
  if (!selectedId.value) return;
  const updated = await updateCard(selectedId.value, payload);
  cards.value = cards.value.map((c) => (c.id === updated.id ? updated : c));
}

async function removeCard() {
  if (!selectedId.value) return;
  await deleteCard(selectedId.value);
  cards.value = cards.value.filter((c) => c.id !== selectedId.value);
  selectedId.value = cards.value[0]?.id ?? null;
}

function swapCard(ordA: number, ordB: number) {
  const cardA = cards.value.find((c) => c.ord === ordA);
  const cardB = cards.value.find((c) => c.ord === ordB);
  if (!cardA || !cardB) return;
  cardA.ord = ordB;
  cardB.ord = ordA;
}

async function moveCard(id: string) {
  const card = cards.value.find((c) => c.id === id);
  if (!card) return;
  const prevOrd = card.ord - 1;
  const prev = cards.value.find((c) => c.ord === prevOrd);
  if (!prev) return;
  swapCard(card.ord, prevOrd);
  await updateCard(card.id, { ord: card.ord });
  await updateCard(prev.id, { ord: prev.ord });
  cards.value.sort((a, b) => a.ord - b.ord);
}

async function moveCardDown(id: string) {
  const card = cards.value.find((c) => c.id === id);
  if (!card) return;
  const nextOrd = card.ord + 1;
  const next = cards.value.find((c) => c.ord === nextOrd);
  if (!next) return;
  swapCard(card.ord, nextOrd);
  await updateCard(card.id, { ord: card.ord });
  await updateCard(next.id, { ord: next.ord });
  cards.value.sort((a, b) => a.ord - b.ord);
}

async function publish() {
  if (!page.value) return;
  page.value = await updatePage(page.value.id, { status: 'published' });
}

async function unpublish() {
  if (!page.value) return;
  page.value = await updatePage(page.value.id, { status: 'draft' });
}

onMounted(load);
</script>
