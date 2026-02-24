const STORAGE = {
  userKey: "paradox.userKey",
  bookmarks: "paradox.bookmarks",
  notes: "paradox.notes"
};

function getUserKey(){
  let key = localStorage.getItem(STORAGE.userKey);
  if(!key){
    key = (crypto?.randomUUID?.() || `pv_${Date.now()}_${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(STORAGE.userKey, key);
  }
  return key;
}

function readJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}

function writeJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

async function apiRequest(path, method, body){
  try{
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    if(!res.ok) throw new Error("bad status");
    return await res.json();
  }catch{
    return null;
  }
}

async function loadBookmarks(){
  const userKey = getUserKey();
  const server = await apiRequest(`/api/bookmarks?userKey=${encodeURIComponent(userKey)}`, "GET");
  if(server && Array.isArray(server.bookmarks)){
    writeJSON(STORAGE.bookmarks, server.bookmarks);
    return server.bookmarks;
  }
  return readJSON(STORAGE.bookmarks, []);
}

async function toggleBookmark(slug){
  const userKey = getUserKey();
  const current = readJSON(STORAGE.bookmarks, []);
  const has = current.includes(slug);
  let next;
  if(has){
    next = current.filter((s) => s !== slug);
    const server = await apiRequest("/api/bookmarks", "DELETE", { userKey, entry_slug: slug });
    if(server && Array.isArray(server.bookmarks)) next = server.bookmarks;
  }else{
    next = [...current, slug].slice(0, 500);
    const server = await apiRequest("/api/bookmarks", "POST", { userKey, entry_slug: slug });
    if(server && Array.isArray(server.bookmarks)) next = server.bookmarks;
  }
  writeJSON(STORAGE.bookmarks, next);
  return next;
}

async function loadNotes(entrySlug){
  const userKey = getUserKey();
  const q = entrySlug ? `&entry_slug=${encodeURIComponent(entrySlug)}` : "";
  const server = await apiRequest(`/api/notes?userKey=${encodeURIComponent(userKey)}${q}`, "GET");
  if(server && Array.isArray(server.notes)){
    writeJSON(STORAGE.notes, server.notes);
    return server.notes;
  }
  const all = readJSON(STORAGE.notes, []);
  return entrySlug ? all.filter((n) => n.entry_slug === entrySlug) : all;
}

async function saveNote(entry_slug, note_text, id){
  const userKey = getUserKey();
  const server = await apiRequest("/api/notes", "POST", { userKey, entry_slug, note_text, id });
  if(server && Array.isArray(server.notes)){
    writeJSON(STORAGE.notes, server.notes);
    return server.notes;
  }
  const all = readJSON(STORAGE.notes, []);
  if(id){
    const idx = all.findIndex((n) => n.id === id);
    if(idx >= 0) all[idx] = { ...all[idx], note_text, updated_at: new Date().toISOString() };
  }else{
    all.unshift({ id: Date.now(), entry_slug, note_text, updated_at: new Date().toISOString() });
  }
  writeJSON(STORAGE.notes, all);
  return all;
}

async function deleteNote(id){
  const userKey = getUserKey();
  const server = await apiRequest("/api/notes", "DELETE", { userKey, id });
  if(server && Array.isArray(server.notes)){
    writeJSON(STORAGE.notes, server.notes);
    return server.notes;
  }
  const all = readJSON(STORAGE.notes, []);
  const next = all.filter((n) => n.id !== id);
  writeJSON(STORAGE.notes, next);
  return next;
}

function initBookmarks(){
  document.querySelectorAll("[data-bookmark]").forEach(async (btn) => {
    const slug = btn.getAttribute("data-bookmark");
    const list = await loadBookmarks();
    btn.dataset.active = list.includes(slug) ? "true" : "false";
    btn.addEventListener("click", async () => {
      const next = await toggleBookmark(slug);
      btn.dataset.active = next.includes(slug) ? "true" : "false";
    });
  });
}

function initSearch(){
  const list = document.querySelector("[data-vault-list]");
  if(!list) return;
  const qInput = document.querySelector("[data-search]");
  const typeSelect = document.querySelector("[data-filter-type]");
  const tagSelect = document.querySelector("[data-filter-tag]");
  const countEl = document.querySelector("[data-result-count]");
  const emptyEl = document.querySelector("[data-empty-state]");
  const clearBtn = document.querySelector("[data-clear-search]");
  const rows = Array.from(list.querySelectorAll("[data-entry-card]"));

  const updateUrl = (q, type, tag) => {
    const params = new URLSearchParams();
    if(q) params.set("q", q);
    if(type && type !== "all") params.set("type", type);
    if(tag && tag !== "all") params.set("tag", tag);
    const next = `${location.pathname}?${params.toString()}`;
    history.replaceState({}, "", next);
  };

  const apply = () => {
    const q = qInput?.value?.toLowerCase() || "";
    const type = typeSelect?.value || "all";
    const tag = tagSelect?.value || "all";
    let visibleCount = 0;
    rows.forEach((row) => {
      const matchQ = !q || row.dataset.search?.includes(q);
      const matchType = type === "all" || row.dataset.type === type;
      const matchTag = tag === "all" || row.dataset.tags?.split(",").includes(tag);
      const show = matchQ && matchType && matchTag;
      row.style.display = show ? "grid" : "none";
      if(show) visibleCount += 1;
    });
    updateUrl(q, type, tag);
    if(countEl) countEl.textContent = `${visibleCount} result${visibleCount === 1 ? "" : "s"}`;
    if(emptyEl) emptyEl.hidden = visibleCount !== 0;
  };

  qInput?.addEventListener("input", apply);
  typeSelect?.addEventListener("change", apply);
  tagSelect?.addEventListener("change", apply);
  clearBtn?.addEventListener("click", () => {
    if(qInput) qInput.value = "";
    if(typeSelect) typeSelect.value = "all";
    if(tagSelect) tagSelect.value = "all";
    apply();
  });

  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  const type = params.get("type") || "all";
  const tag = params.get("tag") || "all";
  if(qInput) qInput.value = q;
  if(typeSelect) typeSelect.value = type;
  if(tagSelect) tagSelect.value = tag;
  apply();
}

function initBookmarksPage(){
  const target = document.querySelector("[data-bookmarks-list]");
  if(!target) return;
  loadBookmarks().then((items) => {
    if(!items.length){
      target.innerHTML = "<p class='entry-summary'>No bookmarks yet.</p>";
      return;
    }
    const map = new Map((window.__ENTRIES__ || []).map((w) => [w.slug, w]));
    target.innerHTML = items.map((slug) => {
      const entry = map.get(slug);
      if(!entry) return "";
      return `
        <article class="entry-card">
          <h3><a href="/vault/${slug}">${entry.title}</a></h3>
          <div class="entry-meta"><span class="pill">${entry.type}</span></div>
          <p class="entry-summary">${entry.summary}</p>
          <div class="entry-tags">
            ${(entry.tags || []).map((t) => `<a class="pill" href="/tags/${t}">${t}</a>`).join("")}
          </div>
        </article>
      `;
    }).join("");
  });
}

function initNotesPage(){
  const target = document.querySelector("[data-notes-list]");
  if(!target) return;
  loadNotes().then((notes) => {
    if(!notes.length){
      target.innerHTML = "<p class='entry-summary'>No notes yet.</p>";
      return;
    }
    const map = new Map((window.__ENTRIES__ || []).map((w) => [w.slug, w]));
    const grouped = notes.reduce((acc, note) => {
      acc[note.entry_slug] = acc[note.entry_slug] || [];
      acc[note.entry_slug].push(note);
      return acc;
    }, {});
    target.innerHTML = Object.entries(grouped).map(([slug, list]) => {
      const entry = map.get(slug);
      const title = entry ? entry.title : slug;
      const summary = entry?.summary || "";
      const items = list.map((n) => `<div class="note-card"><p>${n.note_text}</p><small>${new Date(n.updated_at).toLocaleString()}</small></div>`).join("");
      return `
        <section class="panel">
          <h3><a href="/vault/${slug}">${title}</a></h3>
          <p class="entry-summary">${summary}</p>
          <div class="entry-meta"><span class="pill">${entry?.type || "NOTE"}</span></div>
          ${items}
        </section>
      `;
    }).join("");
  });
}

function initEntryNotes(){
  const form = document.querySelector("[data-note-form]");
  if(!form) return;
  const slug = form.dataset.slug;
  const textarea = form.querySelector("textarea");
  const list = document.querySelector("[data-note-list]");
  const render = (notes) => {
    if(!notes.length){
      list.innerHTML = "<p class='entry-summary'>No notes yet.</p>";
      return;
    }
    list.innerHTML = notes.map((note) => `
      <div class="note-card">
        <p>${note.note_text}</p>
        <div class="controls">
          <button class="pill" data-note-edit="${note.id}">Edit</button>
          <button class="pill" data-note-delete="${note.id}">Delete</button>
        </div>
      </div>
    `).join("");
    list.querySelectorAll("[data-note-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.noteEdit);
        const current = notes.find((n) => n.id === id);
        if(!current) return;
        textarea.value = current.note_text;
        form.dataset.editing = String(id);
        form.querySelector("button[type='submit']").textContent = "Update Note";
      });
    });
    list.querySelectorAll("[data-note-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await deleteNote(Number(btn.dataset.noteDelete));
        const updated = await loadNotes(slug);
        render(updated);
      });
    });
  };

  loadNotes(slug).then(render);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = textarea.value.trim();
    if(!value) return;
    const editId = form.dataset.editing ? Number(form.dataset.editing) : null;
    await saveNote(slug, value, editId || undefined);
    textarea.value = "";
    form.dataset.editing = "";
    form.querySelector("button[type='submit']").textContent = "Save Note";
    const updated = await loadNotes(slug);
    render(updated);
  });
}

function initRandom(){
  const btn = document.querySelector("[data-random]");
  if(!btn) return;
  btn.addEventListener("click", () => {
    const entries = window.__ENTRIES__ || [];
    if(!entries.length) return;
    const pick = entries[Math.floor(Math.random() * entries.length)];
    location.href = `/vault/${pick.slug}`;
  });
}

initBookmarks();
initSearch();
initBookmarksPage();
initNotesPage();
initEntryNotes();
initRandom();
