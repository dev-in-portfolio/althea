const STORAGE = {
  userKey: "itt.userKey",
  favorites: "itt.favorites",
  customTerms: "itt.customTerms"
};

const getUserKey = () => {
  let key = localStorage.getItem(STORAGE.userKey);
  if (!key) {
    key = (crypto?.randomUUID?.() || `itt_${Date.now()}_${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(STORAGE.userKey, key);
  }
  return key;
};

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const apiRequest = async (path, method, body) => {
  try {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error("bad status");
    return await res.json();
  } catch {
    return null;
  }
};

const loadTerms = async () => {
  const res = await fetch("/data/terms.json");
  const terms = await res.json();
  const custom = readJSON(STORAGE.customTerms, []);
  return [...terms, ...custom.map((t) => ({ ...t, _localOnly: true }))];
};

let favoriteCache = [];

const loadFavorites = async () => {
  const userKey = getUserKey();
  const server = await apiRequest(`/api/favorites?userKey=${encodeURIComponent(userKey)}`, "GET");
  if (server && Array.isArray(server.favorites)) {
    writeJSON(STORAGE.favorites, server.favorites);
    favoriteCache = server.favorites;
    return favoriteCache;
  }
  favoriteCache = readJSON(STORAGE.favorites, []);
  return favoriteCache;
};

const toggleFavorite = async (slug) => {
  const userKey = getUserKey();
  const current = readJSON(STORAGE.favorites, []);
  const has = current.includes(slug);
  let next;
  if (has) {
    next = current.filter((s) => s !== slug);
    const server = await apiRequest("/api/favorites", "DELETE", { userKey, term_slug: slug });
    if (server && Array.isArray(server.favorites)) next = server.favorites;
  } else {
    next = [...current, slug];
    const server = await apiRequest("/api/favorites", "POST", { userKey, term_slug: slug });
    if (server && Array.isArray(server.favorites)) next = server.favorites;
  }
  writeJSON(STORAGE.favorites, next);
  return next;
};

const saveCustomTerm = async (term) => {
  const userKey = getUserKey();
  const server = await apiRequest("/api/custom-terms", "POST", { userKey, term });
  if (server && Array.isArray(server.terms)) {
    return server.terms;
  }
  const local = readJSON(STORAGE.customTerms, []);
  local.unshift({ ...term, _localOnly: true, _id: Date.now() });
  writeJSON(STORAGE.customTerms, local);
  return local;
};

const loadCustomTerms = async () => {
  const userKey = getUserKey();
  const server = await apiRequest(`/api/custom-terms?userKey=${encodeURIComponent(userKey)}`, "GET");
  if (server && Array.isArray(server.terms)) {
    return server.terms.map((t) => ({ ...t.payload, _id: t.id }));
  }
  return readJSON(STORAGE.customTerms, []).map((t) => ({ ...t }));
};

const scoreTerm = (term, q, dir) => {
  if (!q) return 0;
  const query = q.toLowerCase();
  const termText = term.term.toLowerCase();
  const techText = term.techEquivalent.join(" ").toLowerCase();
  const tags = term.tags.join(" ").toLowerCase();
  const related = term.related.join(" ").toLowerCase();
  const target = dir === "rest-to-tech" ? termText : techText;

  let score = 0;
  if (target === query) score += 100;
  if (target.startsWith(query)) score += 60;
  if (target.includes(query)) score += 40;
  if (termText.includes(query) || techText.includes(query)) score += 20;
  if (tags.includes(query)) score += 10;
  if (related.includes(query)) score += 5;
  return score;
};

const renderBestMatch = (term, secondary = [], fallback = [], dir = "rest-to-tech") => {
  const target = document.querySelector("[data-result]");
  if (!target) return;
  if (!term) {
    if (fallback.length) {
      target.innerHTML = `
        <div class="result-meta">Ready — Top Terms</div>
        <ul class="result-list">
          ${fallback.map((s) => `<li data-term-link="${s.slug}">${s.term} — ${s.techEquivalent[0] || ""}</li>`).join("")}
        </ul>
      `;
      return;
    }
    target.innerHTML = "<div class='muted'>No match yet.</div>";
    return;
  }
  const primaryLabel = dir === "rest-to-tech" ? "Restaurant" : "Tech";
  const secondaryLabel = dir === "rest-to-tech" ? "Tech" : "Restaurant";
  const primaryDef = dir === "rest-to-tech" ? term.definitionRestaurant : term.definitionTech;
  const secondaryDef = dir === "rest-to-tech" ? term.definitionTech : term.definitionRestaurant;
  target.innerHTML = `
    <div class="plating-badge"><span class="armed-dot"></span>Plating Window</div>
    <div class="result-best">${term.term}</div>
    <div class="result-meta">${term.category} • ${term.techEquivalent.join(", ")}</div>
    <div class="result-meta">${primaryLabel}: ${primaryDef}</div>
    <div class="result-meta">${secondaryLabel}: ${secondaryDef}</div>
    ${secondary.length ? `
      <div class="result-meta">Secondary Matches</div>
      <ul class="result-list">
        ${secondary.map((s) => `<li>${s.term} — ${s.techEquivalent[0] || ""}</li>`).join("")}
      </ul>
    ` : ""}
  `;
};

const initTranslator = async () => {
  const dirSelect = document.querySelector("[data-dir]");
  const catSelect = document.querySelector("[data-category]");
  const subSelect = document.querySelector("[data-subcategory]");
  const termSelect = document.querySelector("[data-term]");
  const fireBtn = document.querySelector("[data-fire]");
  const clearBtn = document.querySelector("[data-clear]");
  const termCountEl = document.querySelector("[data-term-count]");
  const jumpInput = document.querySelector("[data-jump]");
  if (!dirSelect || !catSelect || !subSelect || !termSelect) return;

  await loadFavorites();
  const terms = await loadTerms();
  const statusEl = document.querySelector("[data-status]");
  const briefEl = document.querySelector("[data-brief]");
  const resultsPanel = document.querySelector(".results-panel");
  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };
  const setBrief = (text) => {
    if (briefEl) briefEl.textContent = text;
  };
  const playTick = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 520;
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // no audio
    }
  };
  const activeRush = new Set();
  const activeSignals = new Set();

  const categoryDefs = [
    { value: "all", label: "All" , match: () => true },
    { value: "restaurant", label: "Restaurant", match: () => true },
    { value: "BOH", label: "Back of House", match: (t) => t.category === "BOH" },
    { value: "FOH", label: "Front of House", match: (t) => t.category === "FOH" },
    { value: "MANAGEMENT", label: "Management", match: (t) => t.category === "MANAGEMENT" },
    { value: "INVENTORY", label: "Inventory", match: (t) => t.category === "INVENTORY" },
    { value: "SERVICE", label: "Service", match: (t) => t.category === "SERVICE" },
    { value: "GENERAL", label: "General", match: (t) => t.category === "GENERAL" }
  ];
  catSelect.innerHTML = categoryDefs.map((c) => {
    const count = terms.filter((t) => c.match(t)).length;
    return `<option value="${c.value}">${c.label} (${count})</option>`;
  }).join("");

  const rushMatchers = {
    "Hot": ["hot", "rush", "urgent", "priority", "fire"],
    "On The Fly": ["on the fly", "urgent", "priority", "rush"],
    "All Day": ["all day", "backlog", "queue", "aggregate", "count"],
    "86 Mode": ["86", "out", "deprec", "unavailable", "void"]
  };
  const signalMatchers = {
    "Incident": ["incident", "alert", "issue"],
    "Outage": ["outage", "down", "offline"],
    "Escalation": ["escalation", "page", "on-call"],
    "Critical": ["critical", "sev", "emergency"],
    "Latency": ["latency", "drag", "slow", "backlog"],
    "Degraded": ["degraded", "partial", "reduced"],
    "Quality": ["quality", "refire", "void", "complaint"],
    "Capacity": ["capacity", "overload", "weeds", "rush"],
    "Safety": ["safety", "allergy", "hazard"],
    "Stockout": ["stockout", "out of stock", "86", "depletion"]
  };

  const matchesKeywords = (term, words) => {
    if (!words?.length) return true;
    const hay = `${term.term} ${term.definitionRestaurant} ${term.definitionTech} ${term.techEquivalent.join(" ")} ${(term.tags || []).join(" ")}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  };

  const filteredTerms = () => {
    const cat = catSelect.value;
    const def = categoryDefs.find((d) => d.value === cat) || categoryDefs[0];
    const sub = subSelect.value;
    return terms.filter((t) => {
      if (!def.match(t)) return false;
      if (sub !== "all" && !(t.tags || []).includes(sub)) return false;
      if (activeRush.size) {
        const ok = Array.from(activeRush).some((r) => matchesKeywords(t, rushMatchers[r]));
        if (!ok) return false;
      }
      if (activeSignals.size) {
        const ok = Array.from(activeSignals).some((s) => matchesKeywords(t, signalMatchers[s]));
        if (!ok) return false;
      }
      return true;
    });
  };

  const populateSubcategories = () => {
    const scoped = filteredTerms();
    const subs = new Set();
    scoped.forEach((t) => {
      (t.tags || []).forEach((tag) => subs.add(tag));
    });
    const list = Array.from(subs).sort();
    subSelect.innerHTML = `<option value="all">All Subcategories</option>` +
      list.map((s) => `<option value="${s}">${s}</option>`).join("");
  };

  const populateTerms = () => {
    const list = filteredTerms();
    termSelect.innerHTML = `<option value="">Select a term…</option>` +
      list.map((t) => `<option value="${t.slug}">${t.term}</option>`).join("");
    if (termCountEl) termCountEl.textContent = `Available terms: ${list.length}`;
    if (fireBtn) {
      fireBtn.disabled = !termSelect.value;
      fireBtn.classList.toggle("armed", !!termSelect.value);
    }
    if (!list.length) setStatus("No Match Found");
  };

  const fire = () => {
    const slug = termSelect.value;
    if (!slug) {
      renderBestMatch(null, [], terms.slice(0, 8), dirSelect.value);
      setStatus("Ready");
      setBrief("");
      resultsPanel?.classList.remove("armed");
      return;
    }
    const term = terms.find((t) => t.slug === slug);
    renderBestMatch(term, [], [], dirSelect.value);
    setStatus("Result Found");
    setBrief(dirSelect.value === "rest-to-tech" ? "Kitchen → Tech briefing ready." : "Tech → Kitchen briefing ready.");
    resultsPanel?.classList.add("armed");
    playTick();
  };

  catSelect.addEventListener("change", () => {
    populateSubcategories();
    populateTerms();
    setStatus("Walking In…");
  });
  subSelect.addEventListener("change", () => {
    populateTerms();
    setStatus("Walking In…");
  });
  dirSelect.addEventListener("change", () => {
    fire();
  });
  termSelect.addEventListener("change", () => {
    if (fireBtn) fireBtn.disabled = !termSelect.value;
    setStatus("Ready");
    if (termSelect.value) fire();
  });
  jumpInput?.addEventListener("input", () => {
    const q = jumpInput.value.trim().toLowerCase();
    if (!q) return;
    const list = filteredTerms();
    const hit = list.find((t) => t.term.toLowerCase().includes(q));
    if (hit) {
      termSelect.value = hit.slug;
      fire();
    }
  });
  fireBtn?.addEventListener("click", fire);
  clearBtn?.addEventListener("click", () => {
    catSelect.value = "all";
    subSelect.value = "all";
    populateSubcategories();
    populateTerms();
    termSelect.value = "";
    renderBestMatch(null, [], terms.slice(0, 8), dirSelect.value);
    setStatus("Ready");
    setBrief("");
    playTick();
  });

  const updateRushCounts = () => {
    document.querySelectorAll("[data-toggle]").forEach((btn) => {
      const label = btn.getAttribute("data-toggle");
      if (!label) return;
      const list = terms.filter((t) => matchesKeywords(t, rushMatchers[label]));
      let countEl = btn.querySelector(".count");
      if (!countEl) {
        countEl = document.createElement("span");
        countEl.className = "count";
        btn.appendChild(countEl);
      }
      countEl.textContent = list.length;
    });
  };
  updateRushCounts();

  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const label = btn.getAttribute("data-toggle");
      if (!label) return;
      if (activeRush.has(label)) activeRush.delete(label);
      else activeRush.add(label);
      btn.classList.toggle("active");
      populateSubcategories();
      populateTerms();
      setStatus(activeRush.size ? `Rush: ${label}` : "Ready");
      playTick();
    });
  });

  document.querySelectorAll("[data-signal]").forEach((item) => {
    item.addEventListener("click", () => {
      const label = item.getAttribute("data-signal");
      if (!label) return;
      if (activeSignals.has(label)) activeSignals.delete(label);
      else activeSignals.add(label);
      item.classList.toggle("active");
      populateSubcategories();
      populateTerms();
      setStatus(activeSignals.size ? `Signal: ${label}` : "Ready");
      playTick();
    });
  });

  const resultsContainer = document.querySelector("[data-result]");
  resultsContainer?.addEventListener("click", (e) => {
    const row = e.target.closest("[data-term-link]");
    if (!row) return;
    const slug = row.getAttribute("data-term-link");
    if (!slug) return;
    termSelect.value = slug;
    fire();
  });

  populateSubcategories();
  populateTerms();
  renderBestMatch(null, [], terms.slice(0, 8), dirSelect.value);
  setStatus("Walking In…");
};

const initTermFilters = () => {
  const list = document.querySelector("[data-term-list]");
  if (!list) return;
  const qInput = document.querySelector("[data-term-search]");
  const catSelect = document.querySelector("[data-term-category]");
  const tagSelect = document.querySelector("[data-term-tag]");
  const countEl = document.querySelector("[data-term-count]");
  const emptyEl = document.querySelector("[data-term-empty]");
  const clearBtn = document.querySelector("[data-term-clear]");
  const rows = Array.from(list.querySelectorAll("[data-term-card]"));

  const apply = () => {
    const q = (qInput?.value || "").toLowerCase();
    const cat = catSelect?.value || "all";
    const tag = tagSelect?.value || "all";
    let count = 0;
    rows.forEach((row) => {
      const matchQ = !q || row.dataset.search?.includes(q);
      const matchC = cat === "all" || row.dataset.category === cat;
      const matchT = tag === "all" || row.dataset.tags?.split(",").includes(tag);
      const show = matchQ && matchC && matchT;
      row.style.display = show ? "grid" : "none";
      if (show) count += 1;
    });
    if (countEl) countEl.textContent = `${count} results`;
    if (emptyEl) emptyEl.hidden = count !== 0;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat !== "all") p.set("category", cat);
    if (tag !== "all") p.set("tag", tag);
    history.replaceState({}, "", `${location.pathname}?${p.toString()}`);
  };

  clearBtn?.addEventListener("click", () => {
    if (qInput) qInput.value = "";
    if (catSelect) catSelect.value = "all";
    if (tagSelect) tagSelect.value = "all";
    apply();
  });

  qInput?.addEventListener("input", apply);
  catSelect?.addEventListener("change", apply);
  tagSelect?.addEventListener("change", apply);

  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  const cat = params.get("category") || "all";
  const tag = params.get("tag") || "all";
  if (qInput) qInput.value = q;
  if (catSelect) catSelect.value = cat;
  if (tagSelect) tagSelect.value = tag;
  apply();
};

const initFavorites = async () => {
  const favButtons = document.querySelectorAll("[data-fav]");
  await loadFavorites();
  favButtons.forEach((btn) => {
    const slug = btn.getAttribute("data-fav");
    btn.textContent = favoriteCache.includes(slug) ? "Favorited" : "Favorite";
  });
};

const initFavoritesPage = async () => {
  const list = document.querySelector("[data-fav-list]");
  const empty = document.querySelector("[data-fav-empty]");
  if (!list) return;
  const terms = await loadTerms();
  const favorites = await loadFavorites();
  const items = terms.filter((t) => favorites.includes(t.slug));
  if (!items.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  list.innerHTML = items.map((t) => `
    <article class="term-card">
      <div class="term-title"><a href="/terms/${t.slug}">${t.term}</a></div>
      <div class="term-meta">${t.category} • ${t.techEquivalent.join(", ")}</div>
      <div class="term-desc">${t.definitionRestaurant}</div>
      <div class="controls">
        <button class="btn-ghost" data-fav="${t.slug}">Favorite</button>
      </div>
    </article>
  `).join("");
};

const initCopyButtons = () => {
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = `Copy ${text}`), 1200);
    } catch {
      // ignore
    }
  });
};

const initFavoriteClicks = () => {
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-fav]");
    if (!btn) return;
    const slug = btn.getAttribute("data-fav");
    const next = await toggleFavorite(slug);
    btn.textContent = next.includes(slug) ? "Favorited" : "Favorite";
  });
};

const initContribute = () => {
  const form = document.querySelector("[data-contribute-form]");
  const status = document.querySelector("[data-contribute-status]");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const term = {
      term: data.get("term").toString().trim(),
      slug: data.get("slug").toString().trim(),
      category: data.get("category").toString().trim(),
      techEquivalent: data.get("techEquivalent").toString().split(",").map((s) => s.trim()).filter(Boolean),
      definitionRestaurant: data.get("definitionRestaurant").toString().trim(),
      definitionTech: data.get("definitionTech").toString().trim(),
      examplesRestaurant: data.get("examplesRestaurant").toString().split(",").map((s) => s.trim()).filter(Boolean),
      examplesTech: data.get("examplesTech").toString().split(",").map((s) => s.trim()).filter(Boolean),
      tags: data.get("tags").toString().split(",").map((s) => s.trim()).filter(Boolean),
      related: data.get("related").toString().split(",").map((s) => s.trim()).filter(Boolean)
    };
    await saveCustomTerm(term);
    if (status) {
      status.textContent = "Saved. If backend is unavailable, this is local-only.";
      status.hidden = false;
    }
    form.reset();
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initTranslator();
  initTermFilters();
  initFavorites();
  initFavoriteClicks();
  initFavoritesPage();
  initCopyButtons();
  initContribute();
});
