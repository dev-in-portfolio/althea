<script lang="ts">
  import { invoke } from '@tauri-apps/api/tauri';

  type Repo = { path: string };
  type Branch = { name: string; is_current: boolean; last_commit: string };
  type Status = { staged: number; unstaged: number; files: string[]; diff: string };

  let view: 'repos' | 'branches' | 'status' = 'repos';
  let repos: Repo[] = [];
  let activeRepo = '';
  let branchList: Branch[] = [];
  let status: Status | null = null;
  let commitMessage = '';
  let commandLog = '';
  let newRepoPath = '';

  const load = async () => {
    const data = await invoke('list_repos');
    repos = data.repos;
    activeRepo = data.active_repo;
    if (activeRepo) {
      branchList = await invoke('list_branches', { path: activeRepo });
      status = await invoke('status_summary', { path: activeRepo });
    }
  };

  const addRepo = async () => {
    if (!newRepoPath.trim()) return;
    await invoke('add_repo', { path: newRepoPath });
    newRepoPath = '';
    await load();
  };

  const setRepo = async (path: string) => {
    await invoke('set_active_repo', { path });
    await load();
  };

  const checkout = async (name: string) => {
    commandLog = await invoke('checkout_branch', { path: activeRepo, name });
    await load();
  };

  const stageAll = async () => {
    commandLog = await invoke('stage_all', { path: activeRepo });
    await load();
  };

  const unstageAll = async () => {
    commandLog = await invoke('unstage_all', { path: activeRepo });
    await load();
  };

  const discard = async () => {
    if (!confirm('Discard all local changes? This cannot be undone.')) return;
    commandLog = await invoke('discard_changes', { path: activeRepo });
    await load();
  };

  const commitPush = async () => {
    commandLog = await invoke('commit_and_push', { path: activeRepo, message: commitMessage });
    commitMessage = '';
    await load();
  };

  load();
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand">
      <h1>RepoPilot</h1>
      <p>Local Git cockpit for branches, status, and safe pushes.</p>
    </div>
    <div class="nav">
      <button class:active={view === 'repos'} on:click={() => (view = 'repos')}>Repos</button>
      <button class:active={view === 'branches'} on:click={() => (view = 'branches')}>Branches</button>
      <button class:active={view === 'status'} on:click={() => (view = 'status')}>Status</button>
    </div>
    <div class="panel" style="margin-top: 20px;">
      <h3>Active Repo</h3>
      <p class="muted">{activeRepo || 'None selected'}</p>
      <pre>{commandLog}</pre>
    </div>
  </aside>
  <main class="section">
    {#if view === 'repos'}
      <section class="panel">
        <h2>Repo Catalog</h2>
        <div class="row">
          <input placeholder="/path/to/repo" bind:value={newRepoPath} />
          <button class="primary" on:click={addRepo}>Add</button>
        </div>
        <div class="grid">
          {#each repos as repo}
            <div class="card">
              <h3>{repo.path}</h3>
              <button class="ghost" on:click={() => setRepo(repo.path)}>Activate</button>
            </div>
          {/each}
        </div>
      </section>
    {:else if view === 'branches'}
      <section class="panel">
        <h2>Branches</h2>
        <div class="grid">
          {#each branchList as branch}
            <div class="card">
              <div class="row" style="justify-content: space-between;">
                <strong>{branch.name}</strong>
                {#if branch.is_current}
                  <span class="pill">Current</span>
                {/if}
              </div>
              <p class="muted">{branch.last_commit}</p>
              <button class="ghost" on:click={() => checkout(branch.name)}>Checkout</button>
            </div>
          {/each}
        </div>
      </section>
    {:else}
      <section class="panel">
        <h2>Status + Diff</h2>
        {#if status}
          <div class="row">
            <span class="pill">Staged {status.staged}</span>
            <span class="pill">Unstaged {status.unstaged}</span>
          </div>
          <div class="actions" style="margin-top: 12px;">
            <button class="ghost" on:click={stageAll}>Stage All</button>
            <button class="ghost" on:click={unstageAll}>Unstage All</button>
            <button class="danger" on:click={discard}>Discard</button>
          </div>
          <pre>{status.diff}</pre>
        {/if}
      </section>
      <section class="panel">
        <h2>Commit + Push</h2>
        <input placeholder="Commit message" bind:value={commitMessage} />
        <button class="primary" on:click={commitPush}>Commit & Push</button>
      </section>
    {/if}
  </main>
</div>
