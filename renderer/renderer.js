const repoPanel = document.getElementById("repo-panel");
const detailPanel = document.getElementById("detail-panel");
const logPanel = document.getElementById("log-panel");
const statusBar = document.getElementById("status-bar");

const state = {
  config: null,
  activeRepo: null,
  logs: {},
  running: {},
};

function renderRepos() {
  const repos = state.config.repos;
  repoPanel.innerHTML = `
    <h2>Repos</h2>
    <button id="add-repo">Add Repo</button>
    <div id="repo-list"></div>
  `;
  const list = document.getElementById("repo-list");
  repos.forEach((repo) => {
    const div = document.createElement("div");
    div.className = `repo-item ${state.activeRepo?.id === repo.id ? "active" : ""}`;
    div.textContent = repo.name;
    div.onclick = () => {
      state.activeRepo = repo;
      renderDetail();
      renderRepos();
    };
    list.appendChild(div);
  });

  document.getElementById("add-repo").onclick = async () => {
    const path = await window.dockyard.selectFolder();
    if (!path) return;
    const repo = {
      id: crypto.randomUUID(),
      name: path.split("/").pop(),
      path,
      commands: { dev: "npm run dev", build: "npm run build", test: "npm test", lint: "npm run lint" },
      ports: [3000],
      envPresetBindings: { local: ".env" },
    };
    state.config.repos.push(repo);
    await window.dockyard.saveConfig(state.config);
    renderRepos();
  };
}

function renderDetail() {
  if (!state.activeRepo) {
    detailPanel.innerHTML = `<h2>Details</h2><p>Select a repo.</p>`;
    return;
  }
  const repo = state.activeRepo;
  detailPanel.innerHTML = `
    <h2>${repo.name}</h2>
    <label>Path</label>
    <input id="repo-path" value="${repo.path}" />
    <label>Dev Command</label>
    <input id="cmd-dev" value="${repo.commands.dev}" />
    <label>Build Command</label>
    <input id="cmd-build" value="${repo.commands.build}" />
    <label>Test Command</label>
    <input id="cmd-test" value="${repo.commands.test}" />
    <label>Lint Command</label>
    <input id="cmd-lint" value="${repo.commands.lint}" />
    <label>Ports (comma)</label>
    <input id="repo-ports" value="${repo.ports.join(",")}" />
    <label>Preset</label>
    <select id="preset-select">
      ${state.config.presets.map((p) => `<option value="${p.name}">${p.name}</option>`).join("")}
    </select>
    <label>Env overrides (KEY=VALUE per line)</label>
    <textarea id="env-overrides"></textarea>
    <button id="save-repo">Save</button>
    <button id="run-dev">Start Dev</button>
    <button id="stop-dev">Stop</button>
    <div id="detail-status"></div>
  `;

  document.getElementById("save-repo").onclick = async () => {
    repo.path = document.getElementById("repo-path").value.trim();
    repo.commands.dev = document.getElementById("cmd-dev").value.trim();
    repo.commands.build = document.getElementById("cmd-build").value.trim();
    repo.commands.test = document.getElementById("cmd-test").value.trim();
    repo.commands.lint = document.getElementById("cmd-lint").value.trim();
    repo.ports = document.getElementById("repo-ports").value.split(",").map((p) => Number(p.trim())).filter(Boolean);
    await window.dockyard.saveConfig(state.config);
  };

  document.getElementById("run-dev").onclick = async () => {
    const status = document.getElementById("detail-status");
    try {
      const presetName = document.getElementById("preset-select").value;
      const preset = state.config.presets.find((p) => p.name === presetName);
      const overrides = parseOverrides(document.getElementById("env-overrides").value);
      const portInUse = await window.dockyard.checkPort(repo.ports[0]);
      if (portInUse) {
        status.textContent = "Port already in use.";
        return;
      }
      const hasModules = await window.dockyard.checkNodeModules(repo.path);
      if (!hasModules) {
        status.textContent = "node_modules missing. Run install.";
        return;
      }
      await window.dockyard.runRepo({ repo, command: repo.commands.dev, preset, overrides });
      status.textContent = "Dev server started.";
      state.running[repo.id] = true;
      renderStatus();
    } catch (err) {
      status.textContent = err.message;
    }
  };

  document.getElementById("stop-dev").onclick = async () => {
    await window.dockyard.stopRepo(repo.id);
    state.running[repo.id] = false;
    renderStatus();
  };
}

function parseOverrides(text) {
  const env = {};
  text.split(/\r?\n/).forEach((line) => {
    if (!line.includes("=")) return;
    const [key, ...rest] = line.split("=");
    env[key.trim()] = rest.join("=").trim();
  });
  return env;
}

function renderLogs() {
  logPanel.innerHTML = `
    <h2>Logs</h2>
    <div class="log-box" id="log-box"></div>
  `;
}

function renderStatus() {
  statusBar.innerHTML = Object.entries(state.running)
    .map(([id, running]) => {
      const repo = state.config.repos.find((r) => r.id === id);
      if (!repo) return "";
      return `<span>${repo.name}: ${running ? "running" : "stopped"}</span>`;
    })
    .join("");
}

window.dockyard.onLog(({ repoId, line }) => {
  const box = document.getElementById("log-box");
  if (!box) return;
  box.textContent += `[${repoId.slice(0, 4)}] ${line}`;
  box.scrollTop = box.scrollHeight;
});

window.dockyard.onExit(({ repoId, code }) => {
  state.running[repoId] = false;
  renderStatus();
});

async function init() {
  state.config = await window.dockyard.loadConfig();
  renderRepos();
  renderDetail();
  renderLogs();
  renderStatus();
}

init();
