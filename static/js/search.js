async function loadIndex() {
  try {
    const res = await fetch('/search-index.json');
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
        <h3><a href="${item.url}">${item.title}</a></h3>
        <p>${item.summary || ''}</p>
        <div class="tags">
          ${(item.systems || []).map((t) => `<span>${t}</span>`).join('')}
          ${(item.symptoms || []).map((t) => `<span>${t}</span>`).join('')}
        </div>
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
          (item.summary || '').toLowerCase().includes(query) ||
          (item.systems || []).join(' ').toLowerCase().includes(query) ||
          (item.symptoms || []).join(' ').toLowerCase().includes(query)
        );
      });
      renderResults(results, query ? filtered : index.slice(0, 6));
    });
  });
}

document.addEventListener('DOMContentLoaded', attachSearch);
