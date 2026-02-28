<template>
  <div class="app">
    <header class="app-header">
      <div>
        <p class="eyebrow">CardPress</p>
        <h1>Compose card-based pages in minutes.</h1>
        <p class="sub">Draft, reorder, publish, and share clean narrative pages.</p>
      </div>
      <div class="header-actions">
        <router-link class="button secondary" to="/">Dashboard</router-link>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(120deg, #1d1f3f 0%, #222756 45%, #2a1d49 100%);
  color: #f7f7ff;
  padding: 2.5rem;
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: flex-start;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.7rem;
  opacity: 0.7;
}

.app-header h1 {
  margin: 0.5rem 0;
  font-size: clamp(2rem, 3vw, 3rem);
}

.sub {
  margin: 0;
  color: rgba(247, 247, 255, 0.7);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.app-main {
  padding: 2rem 2.5rem 3rem;
}

@media (max-width: 900px) {
  .app-header {
    flex-direction: column;
  }
}
</style>
