async function loadIndex() {
  try {
    const res = await fetch('/_spec_index.json');
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
        <h3><a href="/specs/${item.id}/">${item.title}</a></h3>
        <p>${item.excerpt}</p>
        <div class="tags">
          ${(item.tags || []).map((t) => `<span>${t}</span>`).join('')}
        </div>
        <span class="pill">${item.status}</span>
      </article>
    `
    )
    .join('');
}

function attachSearch() {
  const input = document.getElementById('search-input');
  const status = document.getElementById('status-filter');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  loadIndex().then((index) => {
    const apply = () => {
      const query = input.value.toLowerCase();
      const statusValue = status ? status.value : '';
      const filtered = index.filter((item) => {
        const matchesQuery =
          item.title.toLowerCase().includes(query) ||
          item.excerpt.toLowerCase().includes(query) ||
          (item.tags || []).join(' ').toLowerCase().includes(query);
        const matchesStatus = statusValue ? item.status === statusValue : true;
        return matchesQuery && matchesStatus;
      });
      renderResults(results, query || statusValue ? filtered : index.slice(0, 6));
    };

    input.addEventListener('input', apply);
    if (status) status.addEventListener('change', apply);
    renderResults(results, index.slice(0, 6));
  });
}

document.addEventListener('DOMContentLoaded', attachSearch);
