<template>
  <div class="app">
    <header class="hero">
      <div>
        <p class="eyebrow">Switchboard</p>
        <h1>Saved Views for Any Dataset</h1>
        <p class="sub">
          Build filter + sort + column presets, share them by URL, and iterate fast.
        </p>
      </div>
      <div class="hero-card">
        <div class="hero-line">
          <span>Route</span>
          <strong>/</strong>
        </div>
        <div class="hero-line">
          <span>Device</span>
          <strong>Local key</strong>
        </div>
        <div class="hero-line">
          <span>State</span>
          <strong>URL-driven</strong>
        </div>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  padding: 2.5rem 2.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(120deg, #0e1a2b 0%, #131b3b 40%, #1c1440 100%);
  color: #f8f7ff;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

.hero h1 {
  font-size: clamp(2rem, 3vw, 3rem);
  margin: 0 0 0.75rem;
}

.sub {
  max-width: 36rem;
  color: rgba(248, 247, 255, 0.7);
  margin: 0;
}

.hero-card {
  background: rgba(12, 12, 24, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  min-width: 200px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
}

.hero-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.85rem;
  padding: 0.35rem 0;
}

main {
  padding: 2rem 2.5rem 3rem;
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
  }
}
</style>
