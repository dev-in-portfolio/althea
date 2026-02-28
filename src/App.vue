<template>
  <div class="app">
    <header class="hero">
      <div>
        <p class="eyebrow">Signal Board</p>
        <h1>Live status tiles with rules and alerts.</h1>
        <p class="sub">Define signals, watch thresholds, and focus on what needs attention.</p>
      </div>
      <nav class="nav">
        <router-link class="button secondary" to="/">Board</router-link>
        <router-link class="button secondary" to="/manage">Manage</router-link>
      </nav>
    </header>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.hero {
  background: linear-gradient(120deg, #0f172a 0%, #172554 40%, #3b0764 100%);
  color: #f8fafc;
  padding: 2.5rem;
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: flex-start;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  opacity: 0.7;
}

.hero h1 {
  margin: 0.5rem 0;
  font-size: clamp(2rem, 3vw, 3rem);
}

.sub {
  margin: 0;
  color: rgba(248, 250, 252, 0.7);
}

.nav {
  display: flex;
  gap: 0.5rem;
}

.content {
  padding: 2rem 2.5rem 3rem;
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
  }
}
</style>
