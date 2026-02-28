import { component$ } from '@builder.io/qwik';
import { Slot } from '@builder.io/qwik';
import '../global.css';

export default component$(() => {
  return (
    <div>
      <header class="hero">
        <div>
          <p class="eyebrow">Qwik CardForge</p>
          <h1>Compose and publish card pages.</h1>
          <p class="sub">Draft, reorder, preview, and ship shareable pages.</p>
        </div>
      </header>
      <main>
        <Slot />
      </main>
    </div>
  );
});
