async function loadIndex() {
  try {
    const res = await fetch('/_patch_index.json');
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
        <h3><a href="/patches/${item.slug}/">${item.title}</a></h3>
        <p>${item.excerpt}</p>
        <div class="tags">
          ${(item.tags || []).map((t) => `<span>${t}</span>`).join('')}
        </div>
        <span class="pill">${item.risk}</span>
      </article>
    `
    )
    .join('');
}

function attachSearch() {
  const input = document.getElementById('search-input');
  const risk = document.getElementById('risk-filter');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  loadIndex().then((index) => {
    const apply = () => {
      const query = input.value.toLowerCase();
      const riskValue = risk ? risk.value : '';
      const filtered = index.filter((item) => {
        const matchesQuery =
          item.title.toLowerCase().includes(query) ||
          item.excerpt.toLowerCase().includes(query) ||
          (item.tags || []).join(' ').toLowerCase().includes(query);
        const matchesRisk = riskValue ? item.risk === riskValue : true;
        return matchesQuery && matchesRisk;
      });
      renderResults(results, query || riskValue ? filtered : index.slice(0, 6));
    };

    input.addEventListener('input', apply);
    if (risk) risk.addEventListener('change', apply);
    renderResults(results, index.slice(0, 6));
  });
}

function attachCopyButtons() {
  document.querySelectorAll('pre code').forEach((code) => {
    const pre = code.parentElement;
    if (!pre || pre.querySelector('.copy-btn')) return;
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.textContent = 'Copy';
    button.onclick = async () => {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Copied';
      setTimeout(() => (button.textContent = 'Copy'), 1000);
    };
    pre.appendChild(button);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachSearch();
  attachCopyButtons();
});
