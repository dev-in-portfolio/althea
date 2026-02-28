async function loadIndex() {
  try {
    const res = await fetch('/_index.json');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function renderResults(container, results) {
  container.innerHTML = results
    .map(
      (item) => `
      <article class="card">
        <h3><a href="/t/${item.slug}/">${item.title}</a></h3>
        <p>${item.summary}</p>
        <div class="tags">
          ${(item.tags || []).map((t) => `<span>${t}</span>`).join('')}
        </div>
        <span class="pill">${item.kind}</span>
      </article>
    `
    )
    .join('');
}

function attachSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  loadIndex().then((index) => {
    renderResults(results, index.slice(0, 6));
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase();
      const filtered = index.filter((item) => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          (item.tags || []).join(' ').toLowerCase().includes(query) ||
          item.kind.toLowerCase().includes(query)
        );
      });
      renderResults(results, query ? filtered : index.slice(0, 6));
    });
  });
}

document.addEventListener('DOMContentLoaded', attachSearch);
