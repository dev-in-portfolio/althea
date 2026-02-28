import { component$ } from '@builder.io/qwik';
import { RouterOutlet } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div>
      <RouterOutlet />
    </div>
  );
});
