import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';

export default component$(() => {
  const loc = useLocation();
  const page = useSignal<any>(null);
  const cards = useSignal<any[]>([]);

  useVisibleTask$(async () => {
    const res = await fetch(`/api/qcf/public/${loc.params.publishedSlug}`);
    if (!res.ok) return;
    const data = await res.json();
    page.value = data.page;
    cards.value = data.cards || [];
  });

  return (
    <section class="panel">
      <h2>{page.value?.title}</h2>
      {cards.value.map((card) => (
        <article key={card.id} class="panel">
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </article>
      ))}
    </section>
  );
});
