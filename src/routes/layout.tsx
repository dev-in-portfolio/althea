import '../global.css';
import { component$ } from '@builder.io/qwik';
import { Slot } from '@builder.io/qwik';

export default component$(() => {
  return (
    <div class="layout">
      <header class="hero">
        <div>
          <p class="eyebrow">Qwik Atlas</p>
          <h1>Collection browser with saved views.</h1>
          <p class="sub">URL-first state, Neon-backed presets, ultra-fast UX.</p>
        </div>
      </header>
      <main>
        <Slot />
      </main>
    </div>
  );
});
