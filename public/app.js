(function () {
  const USER_KEY_STORAGE = 'causality_user_key';

  function getUserKey() {
    let key = localStorage.getItem(USER_KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(USER_KEY_STORAGE, key);
    }
    return key;
  }

  function setUserKeyDisplay(key) {
    const el = document.getElementById('userKeyDisplay');
    if (el) {
      el.textContent = `User: ${key.slice(0, 8)}…`;
    }
  }

  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-key': getUserKey(),
        ...(options.headers || {})
      }
    });

    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }

    if (!res.ok) {
      const message = (data && data.error) || res.statusText || 'Request failed';
      throw new Error(message);
    }
    return data;
  }

  function renderChainList(chains) {
    const container = document.getElementById('chainsList');
    if (!container) return;
    if (!chains.length) {
      container.innerHTML = '<p class="empty">No chains yet.</p>';
      return;
    }
    container.innerHTML = chains
      .map(
        (chain) => `
        <a class="card" href="/chain/${chain.id}">
          <h3>${chain.title}</h3>
          <p>Created ${new Date(chain.created_at).toLocaleString()}</p>
        </a>
      `
      )
      .join('');
  }

  function renderNodes(nodes) {
    const container = document.getElementById('nodesList');
    if (!container) return;
    if (!nodes.length) {
      container.innerHTML = '<p class="empty">No nodes yet.</p>';
      return;
    }
    container.innerHTML = nodes
      .map(
        (node) => `
        <div class="row">
          <div>
            <strong>${node.label}</strong>
            <span class="muted">Weight ${node.weight}</span>
          </div>
          <button data-node-delete="${node.id}" class="ghost">Delete</button>
        </div>
      `
      )
      .join('');
  }

  function renderEdges(edges, nodeMap) {
    const container = document.getElementById('edgesList');
    if (!container) return;
    if (!edges.length) {
      container.innerHTML = '<p class="empty">No edges yet.</p>';
      return;
    }
    container.innerHTML = edges
      .map((edge) => {
        const from = nodeMap.get(edge.from_node_id)?.label || 'Unknown';
        const to = nodeMap.get(edge.to_node_id)?.label || 'Unknown';
        return `
        <div class="row">
          <div>
            <strong>${from}</strong> → <strong>${to}</strong>
            <span class="muted">Strength ${edge.strength}</span>
          </div>
          <button data-edge-delete="${edge.id}" class="ghost">Delete</button>
        </div>
      `;
      })
      .join('');
  }

  function renderSelectOptions(select, nodes) {
    select.innerHTML = nodes
      .map((node) => `<option value="${node.id}">${node.label}</option>`)
      .join('');
  }

  function renderInsights(payload) {
    const container = document.getElementById('insightsPanel');
    if (!container) return;
    if (!payload || !payload.insights) {
      container.innerHTML = '<p class="empty">Run insights to see results.</p>';
      return;
    }
    const { insights } = payload;

    const section = (title, items) => {
      if (!items || !items.length) {
        return `<div class="insight-block"><h3>${title}</h3><p class="empty">No signals yet.</p></div>`;
      }
      return `
        <div class="insight-block">
          <h3>${title}</h3>
          ${items
            .map(
              (item) => `
            <div class="insight">
              <div class="insight-title">${item.label}</div>
              <div class="muted">Score ${(item.score * 100).toFixed(0)}%</div>
              <div class="muted">${item.why || ''}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    };

    const suggestions = insights.suggestions || [];
    const suggestionsBlock = suggestions.length
      ? `
      <div class="insight-block">
        <h3>Suggestions</h3>
        ${suggestions
          .map(
            (item) => `
          <div class="insight">
            <div class="insight-title">${item.target}</div>
            <div class="muted">${item.reason}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
      : '';

    container.innerHTML = `
      ${section('Roots', insights.roots)}
      ${section('Leverage points', insights.leverage)}
      ${section('Bottlenecks', insights.bottlenecks)}
      ${section('Sinks', insights.sinks)}
      ${suggestionsBlock}
      <div class="insight-block">
        <h3>Meta</h3>
        <p class="muted">Nodes: ${insights.meta.nodeCount}, Edges: ${insights.meta.edgeCount}, Cycle: ${insights.meta.hasCycle}</p>
      </div>
    `;
  }

  async function initHome() {
    const form = document.getElementById('createChainForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const title = formData.get('title');
      try {
        const chain = await fetchJSON('/api/chains', {
          method: 'POST',
          body: JSON.stringify({ title })
        });
        window.location.href = `/chain/${chain.id}`;
      } catch (err) {
        alert(err.message);
      }
    });
  }

  async function initHistory() {
    const list = document.getElementById('chainsList');
    if (!list) return;
    try {
      const data = await fetchJSON('/api/chains');
      renderChainList(data.chains || []);
    } catch (err) {
      list.innerHTML = `<p class="empty">${err.message}</p>`;
    }
  }

  async function initChain() {
    if (!window.__CHAIN_ID__) return;
    const chainId = window.__CHAIN_ID__;
    const titleEl = document.getElementById('chainTitle');
    const titleInput = document.getElementById('chainTitleInput');
    const titleForm = document.getElementById('updateTitleForm');
    const nodeForm = document.getElementById('addNodeForm');
    const edgeForm = document.getElementById('addEdgeForm');
    const insightsBtn = document.getElementById('computeInsights');
    const fromSelect = document.getElementById('edgeFrom');
    const toSelect = document.getElementById('edgeTo');

    async function loadChain() {
      const data = await fetchJSON(`/api/chains/${chainId}`);
      if (titleEl) titleEl.textContent = data.chain.title;
      if (titleInput) titleInput.value = data.chain.title;

      const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));
      renderNodes(data.nodes);
      renderEdges(data.edges, nodeMap);
      renderSelectOptions(fromSelect, data.nodes);
      renderSelectOptions(toSelect, data.nodes);
    }

    async function loadInsights() {
      try {
        const payload = await fetchJSON(`/api/chains/${chainId}/insights`);
        renderInsights(payload);
      } catch (err) {
        renderInsights(null);
      }
    }

    if (nodeForm) {
      nodeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(nodeForm);
        const label = formData.get('label');
        const weight = formData.get('weight');
        try {
          await fetchJSON(`/api/chains/${chainId}/nodes`, {
            method: 'POST',
            body: JSON.stringify({ label, weight })
          });
          nodeForm.reset();
          await loadChain();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (edgeForm) {
      edgeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(edgeForm);
        const fromNodeId = formData.get('from');
        const toNodeId = formData.get('to');
        const strength = formData.get('strength');
        try {
          await fetchJSON(`/api/chains/${chainId}/edges`, {
            method: 'POST',
            body: JSON.stringify({ fromNodeId, toNodeId, strength })
          });
          edgeForm.reset();
          await loadChain();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    document.addEventListener('click', async (event) => {
      const nodeBtn = event.target.closest('[data-node-delete]');
      const edgeBtn = event.target.closest('[data-edge-delete]');
      try {
        if (nodeBtn) {
          const nodeId = nodeBtn.getAttribute('data-node-delete');
          await fetchJSON(`/api/chains/${chainId}/nodes/${nodeId}`, { method: 'DELETE' });
          await loadChain();
        }
        if (edgeBtn) {
          const edgeId = edgeBtn.getAttribute('data-edge-delete');
          await fetchJSON(`/api/chains/${chainId}/edges/${edgeId}`, { method: 'DELETE' });
          await loadChain();
        }
      } catch (err) {
        alert(err.message);
      }
    });

    if (insightsBtn) {
      insightsBtn.addEventListener('click', async () => {
        try {
          const payload = await fetchJSON(`/api/chains/${chainId}/insights`, { method: 'POST' });
          renderInsights(payload);
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (titleForm) {
      titleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(titleForm);
        const title = formData.get('title');
        try {
          await fetchJSON(`/api/chains/${chainId}`, {
            method: 'PATCH',
            body: JSON.stringify({ title })
          });
          await loadChain();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    await loadChain();
    await loadInsights();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const key = getUserKey();
    setUserKeyDisplay(key);
    initHome();
    initHistory();
    initChain();
  });
})();
