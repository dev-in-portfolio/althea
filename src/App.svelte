<script lang="ts">
  import { invoke } from '@tauri-apps/api/tauri';

  type Entry = {
    id: number;
    title: string;
    project: string;
    decision: string;
    reason: string;
    expected_outcome: string;
    confidence: number;
    tags: string;
    created_at: string;
  };

  type Outcome = {
    id: number;
    entry_id: number;
    result: string;
    lessons: string;
    repeat: boolean;
    recorded_at: string;
  };

  let view: 'timeline' | 'new' | 'insights' = 'timeline';
  let entries: Entry[] = [];
  let outcomes: Outcome[] = [];
  let filterProject = '';
  let filterTag = '';
  let search = '';
  let status = '';

  let draft = {
    title: '',
    project: '',
    decision: '',
    reason: '',
    expected_outcome: '',
    confidence: 6,
    tags: '',
  };

  let outcomeDraft = {
    entry_id: 0,
    result: '',
    lessons: '',
    repeat: true,
  };

  const load = async () => {
    entries = await invoke('list_entries', { project: filterProject, tag: filterTag, search });
    outcomes = await invoke('list_outcomes');
  };

  const createEntry = async () => {
    status = 'Saving decision...';
    await invoke('create_entry', draft);
    status = 'Decision saved.';
    draft = { title: '', project: '', decision: '', reason: '', expected_outcome: '', confidence: 6, tags: '' };
    await load();
  };

  const attachOutcome = async () => {
    if (!outcomeDraft.entry_id) return;
    status = 'Saving outcome...';
    await invoke('add_outcome', outcomeDraft);
    status = 'Outcome logged.';
    outcomeDraft = { entry_id: 0, result: '', lessons: '', repeat: true };
    await load();
  };

  const exportJson = async () => {
    status = 'Exporting ledger...';
    const path = await invoke<string>('export_json');
    status = `Exported to ${path}`;
  };

  load();
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand">
      <h1>Operator Ledger</h1>
      <p>Decision capture, outcomes, and operator intelligence.</p>
    </div>
    <div class="nav">
      <button class:active={view === 'timeline'} on:click={() => (view = 'timeline')}>Timeline</button>
      <button class:active={view === 'new'} on:click={() => (view = 'new')}>New Entry</button>
      <button class:active={view === 'insights'} on:click={() => (view = 'insights')}>Insights</button>
    </div>
    <div class="panel" style="margin-top: 20px;">
      <h3>Filters</h3>
      <input placeholder="Project" bind:value={filterProject} />
      <input placeholder="Tag" bind:value={filterTag} />
      <input placeholder="Search" bind:value={search} />
      <div class="row" style="margin-top: 10px;">
        <button class="ghost" on:click={load}>Apply</button>
        <button class="ghost" on:click={() => { filterProject=''; filterTag=''; search=''; load(); }}>Reset</button>
      </div>
    </div>
    <div class="panel">
      <h3>System</h3>
      <button class="ghost" on:click={exportJson}>Export JSON</button>
      <p class="muted">{status}</p>
    </div>
  </aside>
  <main class="section">
    {#if view === 'timeline'}
      <section class="panel">
        <h2>Timeline Feed</h2>
        <div class="timeline">
          {#each entries as entry}
            <div class="timeline-item">
              <div class="row" style="justify-content: space-between;">
                <strong>{entry.title}</strong>
                <span class="pill">{entry.project}</span>
              </div>
              <p class="muted">Decision: {entry.decision}</p>
              <p>Expected: {entry.expected_outcome}</p>
              <div class="row">
                <span class="tag">Confidence {entry.confidence}/10</span>
                {#if entry.tags}
                  {#each entry.tags.split(',') as t}
                    <span class="tag">{t.trim()}</span>
                  {/each}
                {/if}
              </div>
              <p class="muted">Logged {entry.created_at}</p>
              {#each outcomes.filter((o) => o.entry_id === entry.id) as outcome}
                <div class="panel" style="margin-top: 10px;">
                  <strong>Outcome</strong>
                  <p>{outcome.result}</p>
                  <p class="muted">Lessons: {outcome.lessons}</p>
                  <span class="pill">{outcome.repeat ? 'Repeat' : 'Do Not Repeat'}</span>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </section>
    {:else if view === 'new'}
      <section class="panel">
        <h2>New Decision</h2>
        <div class="row">
          <input placeholder="Title" bind:value={draft.title} />
          <input placeholder="Project" bind:value={draft.project} />
        </div>
        <textarea placeholder="Decision made" bind:value={draft.decision}></textarea>
        <textarea placeholder="Why" bind:value={draft.reason}></textarea>
        <textarea placeholder="Expected outcome" bind:value={draft.expected_outcome}></textarea>
        <div class="row">
          <input type="number" min="1" max="10" bind:value={draft.confidence} />
          <input placeholder="Tags (comma-separated)" bind:value={draft.tags} />
        </div>
        <div class="row">
          <button class="primary" on:click={createEntry}>Save Decision</button>
        </div>
      </section>
      <section class="panel">
        <h2>Attach Outcome</h2>
        <select bind:value={outcomeDraft.entry_id}>
          <option value="0">Select decision</option>
          {#each entries as entry}
            <option value={entry.id}>{entry.title}</option>
          {/each}
        </select>
        <textarea placeholder="What happened" bind:value={outcomeDraft.result}></textarea>
        <textarea placeholder="Lessons learned" bind:value={outcomeDraft.lessons}></textarea>
        <label class="row">
          <input type="checkbox" bind:checked={outcomeDraft.repeat} />
          Would repeat this decision
        </label>
        <button class="primary" on:click={attachOutcome}>Save Outcome</button>
      </section>
    {:else}
      <section class="panel">
        <h2>Insights</h2>
        <p class="muted">Quick pattern scans and search filters.</p>
        <div class="grid">
          <div class="card">
            <h3>Low Confidence</h3>
            <p class="muted">Decisions with confidence &lt;= 4</p>
            <button class="ghost" on:click={async () => { search = ''; filterProject=''; filterTag=''; entries = await invoke('search_low_confidence'); }}>
              Load
            </button>
          </div>
          <div class="card">
            <h3>Failed Experiments</h3>
            <p class="muted">Outcomes marked as do-not-repeat.</p>
            <button class="ghost" on:click={async () => { entries = await invoke('search_failed'); }}>
              Load
            </button>
          </div>
          <div class="card">
            <h3>Pivots</h3>
            <p class="muted">Entries tagged with pivot.</p>
            <button class="ghost" on:click={async () => { entries = await invoke('search_by_tag', { tag: 'pivot' }); }}>
              Load
            </button>
          </div>
        </div>
      </section>
    {/if}
  </main>
</div>
