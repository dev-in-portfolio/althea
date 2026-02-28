<script lang="ts">
  import { invoke } from '@tauri-apps/api/tauri';

  type ClipboardItem = {
    id: number;
    content: string;
    created_at: string;
    pinned: boolean;
  };

  type Pipeline = {
    id: number;
    name: string;
    steps_json: string;
    hotkey: string | null;
  };

  let view: 'history' | 'pipelines' | 'settings' = 'history';
  let history: ClipboardItem[] = [];
  let pipelines: Pipeline[] = [];
  let previewBefore = '';
  let previewAfter = '';
  let status = '';
  let selectedPipeline = 0;
  let historyLimit = 50;
  let confirmOverwrite = true;

  let pipelineDraft = {
    name: '',
    steps_json: JSON.stringify([
      { type: 'trim_edges', params: {} },
      { type: 'normalize_newlines', params: {} }
    ], null, 2),
    hotkey: ''
  };

  const load = async () => {
    history = await invoke('list_history');
    pipelines = await invoke('list_pipelines');
    const settings = await invoke('get_settings');
    historyLimit = settings.history_limit;
    confirmOverwrite = settings.confirm_overwrite;
  };

  const captureClipboard = async () => {
    await invoke('capture_clipboard');
    history = await invoke('list_history');
  };

  const runPipeline = async () => {
    const pipeline = pipelines.find((p) => p.id === selectedPipeline);
    if (!pipeline) return;
    const input = previewBefore;
    const result = await invoke('run_pipeline', { pipelineId: pipeline.id, input });
    previewAfter = result.output;
  };

  const applyToClipboard = async () => {
    if (confirmOverwrite && !confirm('Overwrite clipboard with processed output?')) return;
    await invoke('set_clipboard', { content: previewAfter });
    status = 'Clipboard updated.';
  };

  const savePipeline = async () => {
    await invoke('save_pipeline', pipelineDraft);
    pipelineDraft = { name: '', steps_json: '[]', hotkey: '' };
    pipelines = await invoke('list_pipelines');
  };

  const deletePipeline = async (id: number) => {
    await invoke('delete_pipeline', { id });
    pipelines = await invoke('list_pipelines');
  };

  const togglePin = async (id: number) => {
    await invoke('toggle_pin', { id });
    history = await invoke('list_history');
  };

  const updateSettings = async () => {
    await invoke('update_settings', { historyLimit, confirmOverwrite });
    status = 'Settings saved.';
  };

  load();
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand">
      <h1>ClipForge</h1>
      <p>Clipboard pipelines, history, and quick transforms.</p>
    </div>
    <div class="nav">
      <button class:active={view === 'history'} on:click={() => (view = 'history')}>History</button>
      <button class:active={view === 'pipelines'} on:click={() => (view = 'pipelines')}>Pipelines</button>
      <button class:active={view === 'settings'} on:click={() => (view = 'settings')}>Settings</button>
    </div>
    <div class="panel" style="margin-top: 20px;">
      <button class="primary" on:click={captureClipboard}>Capture Clipboard</button>
      <p class="muted">{status}</p>
    </div>
  </aside>
  <main class="section">
    {#if view === 'history'}
      <section class="panel">
        <h2>Clipboard History</h2>
        <div class="grid">
          {#each history as item}
            <div class="card">
              <div class="row" style="justify-content: space-between;">
                <span class="pill">{item.pinned ? 'Pinned' : 'Recent'}</span>
                <button class="ghost" on:click={() => togglePin(item.id)}>
                  {item.pinned ? 'Unpin' : 'Pin'}
                </button>
              </div>
              <p class="muted">{item.created_at}</p>
              <pre>{item.content.slice(0, 300)}</pre>
              <div class="actions">
                <button class="ghost" on:click={() => { previewBefore = item.content; previewAfter = ''; }}>
                  Preview
                </button>
              </div>
            </div>
          {/each}
        </div>
      </section>
      <section class="panel">
        <h2>Pipeline Preview</h2>
        <div class="row">
          <select bind:value={selectedPipeline}>
            <option value="0">Select pipeline</option>
            {#each pipelines as pipeline}
              <option value={pipeline.id}>{pipeline.name}</option>
            {/each}
          </select>
          <button class="primary" on:click={runPipeline}>Run Preview</button>
          <button class="ghost" on:click={applyToClipboard}>Apply to Clipboard</button>
        </div>
        <div class="preview">
          <div>
            <h3>Before</h3>
            <pre>{previewBefore}</pre>
          </div>
          <div>
            <h3>After</h3>
            <pre>{previewAfter}</pre>
          </div>
        </div>
      </section>
    {:else if view === 'pipelines'}
      <section class="panel">
        <h2>Pipelines</h2>
        <div class="grid">
          {#each pipelines as pipeline}
            <div class="card">
              <h3>{pipeline.name}</h3>
              <p class="muted">Hotkey: {pipeline.hotkey || 'None'}</p>
              <pre>{pipeline.steps_json}</pre>
              <div class="actions">
                <button class="danger" on:click={() => deletePipeline(pipeline.id)}>Delete</button>
              </div>
            </div>
          {/each}
        </div>
      </section>
      <section class="panel">
        <h2>Create Pipeline</h2>
        <div class="row">
          <input placeholder="Pipeline name" bind:value={pipelineDraft.name} />
          <input placeholder="Hotkey (Ctrl+Shift+1)" bind:value={pipelineDraft.hotkey} />
        </div>
        <textarea rows="10" bind:value={pipelineDraft.steps_json}></textarea>
        <button class="primary" on:click={savePipeline}>Save Pipeline</button>
      </section>
    {:else}
      <section class="panel">
        <h2>Settings</h2>
        <div class="row">
          <input type="number" bind:value={historyLimit} />
          <label class="row">
            <input type="checkbox" bind:checked={confirmOverwrite} />
            Confirm before overwriting clipboard
          </label>
        </div>
        <button class="primary" on:click={updateSettings}>Save Settings</button>
      </section>
    {/if}
  </main>
</div>
