<script lang="ts">
  import { presets } from '$lib/presets/presets';
  import type { SurfaceSettings } from '$lib/presets/types';
  import { normalizeSettings } from '$lib/presets/normalize';
  import { cssRecipe } from '$lib/render/cssRecipe';
  import { getUserKey } from '$lib/client/userKey';
  import { copyToClipboard } from '$lib/client/clipboard';
  import PresetPicker from '$lib/components/PresetPicker.svelte';
  import SurfacePreview from '$lib/components/SurfacePreview.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import RecipeHeader from '$lib/components/RecipeHeader.svelte';

  let settings: SurfaceSettings = normalizeSettings(structuredClone(presets[0].settings));
  let name = presets[0].name;
  let status = '';

  function applyPreset(preset: { name: string; settings: SurfaceSettings }) {
    settings = normalizeSettings(structuredClone(preset.settings));
    name = preset.name;
  }

  async function saveRecipe() {
    status = '';
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-key': getUserKey()
      },
      body: JSON.stringify({ name, settings })
    });
    const data = await res.json();
    if (!res.ok) {
      status = data.error || 'Failed to save.';
    } else {
      status = 'Saved.';
    }
  }

  async function copyJson() {
    const ok = await copyToClipboard(JSON.stringify({ name, settings }, null, 2));
    status = ok ? 'Copied.' : 'Copy failed.';
  }

  async function copyCss() {
    const ok = await copyToClipboard(cssRecipe(settings).style);
    status = ok ? 'CSS copied.' : 'Copy failed.';
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify({ name, settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name || 'surface'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function randomize() {
    const random = presets[Math.floor(Math.random() * presets.length)];
    applyPreset(random);
  }

  function reset() {
    applyPreset(presets[0]);
  }
</script>

<main class="grid">
  <div class="card">
    <h1>SurfaceLab</h1>
    <p class="small">Blend color, texture, lighting, and finish for tactile surfaces.</p>
    {#if status}
      <p class="small">{status}</p>
    {/if}
  </div>

  <PresetPicker {presets} onSelect={applyPreset} />

  <RecipeHeader
    {name}
    onName={(value) => (name = value)}
    onSave={saveRecipe}
    onCopy={copyJson}
    onCopyCss={copyCss}
    onDownload={downloadJson}
    onReset={reset}
  />

  <div class="card">
    <div class="toolbar">
      <button class="btn secondary" on:click={randomize}>Randomize</button>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
    <ControlPanel {settings} onChange={(next) => (settings = next)} />
    <div class="card">
      <h2>Preview</h2>
      <SurfacePreview {settings} />
    </div>
  </div>
</main>
