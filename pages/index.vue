<template>
  <div class="page">
    <header class="hero">
      <h1>Nuxt ViewVault</h1>
      <p>Saved filter and sort views backed by Neon. Build once, reuse everywhere.</p>
      <div class="actions">
        <NuxtLink class="primary" to="/demo">Launch Demo</NuxtLink>
        <NuxtLink class="ghost" to="/views">Manage Views</NuxtLink>
      </div>
    </header>
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px;
}
.hero h1 {
  margin: 0 0 12px;
  font-size: clamp(32px, 4vw, 44px);
}
.hero p {
  color: #94a3b8;
}
.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>
