const API_BASE = "/api/gridsmith";
const datasetSelect = document.getElementById("dataset-select");
const datasetStatus = document.getElementById("dataset-status");
const schemaInput = document.getElementById("schema-input");
const datasetName = document.getElementById("dataset-name");
const datasetSlug = document.getElementById("dataset-slug");
const createDatasetBtn = document.getElementById("create-dataset");
const rowsInput = document.getElementById("rows-input");
const ingestRowsBtn = document.getElementById("ingest-rows");
const rowKeyInput = document.getElementById("row-key");
const rowStatus = document.getElementById("row-status");
const filtersContainer = document.getElementById("filters");
const gridContainer = document.getElementById("grid-container");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

const state = {
  datasets: [],
  activeDataset: null,
  schema: null,
  page: 1,
  pageSize: 25,
  total: 0,
  filters: [],
  sortKey: null,
  sortDir: "desc",
};

const defaultSchema = {
  columns: [
    { key: "title", label: "Title", type: "text", sortable: true, filter: "contains" },
    { key: "status", label: "Status", type: "enum", options: ["open", "closed"], filter: "in" },
    { key: "updated_at", label: "Updated", type: "date", sortable: true, filter: "range" },
  ],
  defaultSort: { key: "updated_at", dir: "desc" },
  pageSize: 25,
};

function deviceKey() {
  let key = localStorage.getItem("gridsmith_device_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("gridsmith_device_key", key);
  }
  return key;
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Key": deviceKey(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function setStatus(el, message) {
  el.textContent = message;
}

function parseSchema() {
  try {
    const schema = JSON.parse(schemaInput.value || "{}");
    if (!schema.columns || schema.columns.length === 0) {
      throw new Error("Schema must include columns");
    }
    if (schema.columns.length > 80) {
      throw new Error("Max 80 columns allowed");
    }
    return schema;
  } catch (err) {
    throw new Error(`Invalid schema JSON: ${err.message}`);
  }
}

async function loadDatasets() {
  try {
    const data = await fetchJSON(`${API_BASE}/datasets`);
    state.datasets = data.datasets;
    datasetSelect.innerHTML = "";
    data.datasets.forEach((dataset) => {
      const option = document.createElement("option");
      option.value = dataset.id;
      option.textContent = `${dataset.name} (${dataset.slug})`;
      datasetSelect.appendChild(option);
    });
    if (data.datasets.length) {
      setActiveDataset(data.datasets[0].id);
    } else {
      schemaInput.value = JSON.stringify(defaultSchema, null, 2);
    }
  } catch (err) {
    setStatus(datasetStatus, err.message);
  }
}

function setActiveDataset(id) {
  state.activeDataset = id;
  const selected = state.datasets.find((d) => d.id === id);
  if (selected) {
    schemaInput.value = JSON.stringify(selected.schema, null, 2);
    state.schema = selected.schema;
    state.pageSize = selected.schema.pageSize || 25;
    state.sortKey = selected.schema.defaultSort?.key || null;
    state.sortDir = selected.schema.defaultSort?.dir || "desc";
    buildFilters();
    loadRows();
  }
}

datasetSelect.addEventListener("change", (e) => {
  setActiveDataset(e.target.value);
});

createDatasetBtn.addEventListener("click", async () => {
  try {
    const schema = parseSchema();
    const payload = {
      name: datasetName.value.trim(),
      slug: datasetSlug.value.trim(),
      schema,
    };
    if (!payload.name) throw new Error("Dataset name is required");
    const data = await fetchJSON(`${API_BASE}/datasets`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStatus(datasetStatus, `Created dataset ${data.name}`);
    await loadDatasets();
  } catch (err) {
    setStatus(datasetStatus, err.message);
  }
});

function buildFilters() {
  filtersContainer.innerHTML = "";
  state.filters = [];
  if (!state.schema) return;
  state.schema.columns
    .filter((col) => col.filter)
    .forEach((col) => {
      const wrapper = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = col.label;
      wrapper.appendChild(label);

      if (col.filter === "in" && Array.isArray(col.options)) {
        const select = document.createElement("select");
        select.multiple = true;
        col.options.forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option;
          opt.textContent = option;
          select.appendChild(opt);
        });
        select.addEventListener("change", () => {
          const values = Array.from(select.selectedOptions).map((opt) => opt.value);
          updateFilter(col.key, "in", values.length ? values : null);
        });
        wrapper.appendChild(select);
      } else if (col.filter === "range") {
        const min = document.createElement("input");
        min.placeholder = "Min";
        const max = document.createElement("input");
        max.placeholder = "Max";
        min.addEventListener("change", () => updateRangeFilter(col.key, min.value, max.value));
        max.addEventListener("change", () => updateRangeFilter(col.key, min.value, max.value));
        wrapper.appendChild(min);
        wrapper.appendChild(max);
      } else {
        const input = document.createElement("input");
        input.placeholder = "Filter";
        input.addEventListener("input", () => {
          updateFilter(col.key, "contains", input.value || null);
        });
        wrapper.appendChild(input);
      }
      filtersContainer.appendChild(wrapper);
    });
}

function updateFilter(key, op, value) {
  state.filters = state.filters.filter((f) => f.key !== key);
  if (value) {
    state.filters.push({ key, op, value });
  }
  state.page = 1;
  loadRows();
}

function updateRangeFilter(key, min, max) {
  state.filters = state.filters.filter((f) => f.key !== key);
  if (min || max) {
    state.filters.push({ key, op: "range", min: Number(min || 0), max: Number(max || 0) });
  }
  state.page = 1;
  loadRows();
}

async function loadRows() {
  if (!state.activeDataset) return;
  const params = new URLSearchParams({
    page: state.page,
    pageSize: state.pageSize,
  });
  if (state.sortKey) {
    params.set("sortKey", state.sortKey);
    params.set("sortDir", state.sortDir);
  }
  if (state.filters.length) {
    params.set("filters", JSON.stringify(state.filters));
  }
  try {
    const data = await fetchJSON(
      `${API_BASE}/datasets/${state.activeDataset}/rows?${params.toString()}`
    );
    state.total = data.total;
    renderGrid(data.rows || []);
    updatePagination();
  } catch (err) {
    gridContainer.innerHTML = `<p class="status">${err.message}</p>`;
  }
}

function renderGrid(rows) {
  if (!state.schema) return;
  if (!rows.length) {
    gridContainer.innerHTML = "<p class=\"status\">No rows yet.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  state.schema.columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    if (col.sortable) {
      th.className = "badge";
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        state.sortKey = col.key;
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        loadRows();
      });
    }
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    state.schema.columns.forEach((col) => {
      const td = document.createElement("td");
      const value = row.data[col.key];
      td.textContent = value !== undefined ? value : "-";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  gridContainer.innerHTML = "";
  gridContainer.appendChild(table);
}

function updatePagination() {
  const totalPages = Math.ceil(state.total / state.pageSize) || 1;
  pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
  prevPageBtn.disabled = state.page <= 1;
  nextPageBtn.disabled = state.page >= totalPages;
}

prevPageBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    loadRows();
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(state.total / state.pageSize) || 1;
  if (state.page < totalPages) {
    state.page += 1;
    loadRows();
  }
});

ingestRowsBtn.addEventListener("click", async () => {
  if (!state.activeDataset) {
    setStatus(rowStatus, "Select a dataset first");
    return;
  }
  try {
    const payload = JSON.parse(rowsInput.value || "[]");
    const rows = Array.isArray(payload) ? payload : [payload];
    const keyField = rowKeyInput.value.trim() || "id";

    for (const row of rows) {
      const rowKey = row[keyField] || crypto.randomUUID();
      await fetchJSON(`${API_BASE}/datasets/${state.activeDataset}/rows`, {
        method: "POST",
        body: JSON.stringify({ rowKey, data: row }),
      });
    }
    setStatus(rowStatus, `Upserted ${rows.length} rows`);
    loadRows();
  } catch (err) {
    setStatus(rowStatus, err.message);
  }
});

schemaInput.value = JSON.stringify(defaultSchema, null, 2);
loadDatasets();
