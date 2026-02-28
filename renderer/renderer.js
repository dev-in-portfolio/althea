const casePanel = document.getElementById("case-panel");
const artifactPanel = document.getElementById("artifact-panel");
const previewPanel = document.getElementById("preview-panel");
const exportBtn = document.getElementById("export-case");

const state = {
  config: null,
  activeCase: null,
  activeArtifact: null,
};

async function loadConfig() {
  state.config = await window.receiptbox.loadConfig();
  renderCases();
  renderArtifacts();
  renderPreview();
}

function renderCases() {
  casePanel.innerHTML = `
    <h2>Cases</h2>
    <label>Title</label>
    <input id="case-title" placeholder="Netlify build fail" />
    <label>Project</label>
    <input id="case-project" placeholder="micro-exhibits" />
    <label>Tags (comma)</label>
    <input id="case-tags" placeholder="deploy,netlify" />
    <button id="create-case">Create Case</button>
    <div id="case-list"></div>
  `;
  const list = document.getElementById("case-list");
  state.config.cases.forEach((caseEntry) => {
    const div = document.createElement("div");
    div.className = `case-item ${state.activeCase?.id === caseEntry.id ? "active" : ""}`;
    div.innerHTML = `<strong>${caseEntry.title}</strong><div>${caseEntry.project}</div>`;
    div.onclick = () => {
      state.activeCase = caseEntry;
      state.activeArtifact = null;
      renderCases();
      renderArtifacts();
      renderPreview();
    };
    list.appendChild(div);
  });

  document.getElementById("create-case").onclick = async () => {
    const title = document.getElementById("case-title").value.trim();
    const project = document.getElementById("case-project").value.trim();
    const tags = document.getElementById("case-tags").value.split(",").map((t) => t.trim()).filter(Boolean);
    if (!title || !project) return;
    const created = await window.receiptbox.createCase({ title, project, tags });
    state.config.cases.push(created);
    state.activeCase = created;
    renderCases();
    renderArtifacts();
  };
}

function renderArtifacts() {
  if (!state.activeCase) {
    artifactPanel.innerHTML = `<h2>Artifacts</h2><p>Select a case.</p>`;
    return;
  }
  const artifacts = state.config.artifacts.filter((a) => a.caseId === state.activeCase.id);
  artifactPanel.innerHTML = `
    <h2>Artifacts</h2>
    <button id="add-artifact">Add Files</button>
    <div id="artifact-list"></div>
  `;

  document.getElementById("add-artifact").onclick = async () => {
    const paths = await window.receiptbox.pickFiles();
    for (const filePath of paths) {
      const result = await window.receiptbox.addArtifact({ caseId: state.activeCase.id, filePath });
      if (!result.duplicate) {
        state.config.artifacts.push(result.artifact);
      }
    }
    renderArtifacts();
  };

  const list = document.getElementById("artifact-list");
  artifacts.forEach((artifact) => {
    const div = document.createElement("div");
    div.className = "artifact-item";
    div.innerHTML = `<strong>${artifact.filename}</strong><div>${artifact.type}</div>`;
    div.onclick = () => {
      state.activeArtifact = artifact;
      renderPreview();
    };
    list.appendChild(div);
  });
}

function renderPreview() {
  if (!state.activeArtifact) {
    previewPanel.innerHTML = `<h2>Preview</h2><p>Select an artifact.</p>`;
    return;
  }
  const artifact = state.activeArtifact;
  previewPanel.innerHTML = `
    <h2>${artifact.filename}</h2>
    <div class="preview" id="preview-box"></div>
    <label>Tags (comma)</label>
    <input id="artifact-tags" value="${artifact.tags.join(",")}" />
    <label>Notes</label>
    <textarea id="artifact-notes">${artifact.notes}</textarea>
    <button id="save-artifact">Save</button>
  `;

  const previewBox = document.getElementById("preview-box");
  if (artifact.type === "image") {
    const img = document.createElement("img");
    img.src = `file://${state.activeCase.folder}/artifacts/${artifact.filename}`;
    img.style.maxWidth = "100%";
    previewBox.appendChild(img);
  } else {
    previewBox.textContent = artifact.filename;
  }

  document.getElementById("save-artifact").onclick = async () => {
    const tags = document.getElementById("artifact-tags").value.split(",").map((t) => t.trim()).filter(Boolean);
    const notes = document.getElementById("artifact-notes").value;
    const updated = await window.receiptbox.updateArtifact({ id: artifact.id, updates: { tags, notes } });
    Object.assign(artifact, updated);
  };
}

exportBtn.onclick = async () => {
  if (!state.activeCase) return;
  await window.receiptbox.exportBundle(state.activeCase.id);
};

loadConfig();
