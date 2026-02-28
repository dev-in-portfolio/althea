import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

function getDeviceKey() {
  const key = 'qcf_device_key';
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

export default component$(() => {
  const pages = useSignal<any[]>([]);
  const title = useSignal('');
  const slug = useSignal('');
  const status = useSignal('');

  useVisibleTask$(async () => {
    await loadPages();
  });

  async function loadPages() {
    const res = await fetch('/api/qcf/pages', {
      headers: { 'X-Device-Key': getDeviceKey() },
    });
    const data = await res.json();
    pages.value = data.pages || [];
  }

  async function createPage() {
    if (!title.value || !slug.value) {
      status.value = 'Title and slug required.';
      return;
    }
    await fetch('/api/qcf/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Key': getDeviceKey(),
      },
      body: JSON.stringify({ title: title.value, slug: slug.value }),
    });
    title.value = '';
    slug.value = '';
    status.value = 'Created.';
    await loadPages();
  }

  return (
    <section class="grid grid-2">
      <div class="panel">
        <h3>Create Page</h3>
        <label>Title</label>
        <input value={title.value} onInput$={(e) => (title.value = (e.target as HTMLInputElement).value)} />
        <label>Slug</label>
        <input value={slug.value} onInput$={(e) => (slug.value = (e.target as HTMLInputElement).value)} />
        <button class="button" onClick$={createPage}>Create</button>
        <p>{status.value}</p>
      </div>

      <div class="panel">
        <h3>Pages</h3>
        <ul>
          {pages.value.map((page) => (
            <li key={page.id}>
              <strong>{page.title}</strong> — {page.status}
              <a class="button secondary" href={`/edit/${page.id}`}>Edit</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
});
