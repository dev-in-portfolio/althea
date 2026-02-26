<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserKey } from '$lib/client/userKey';
  import FrameList from '$lib/components/FrameList.svelte';
  import FrameEditor from '$lib/components/FrameEditor.svelte';
  import FrameReorderControls from '$lib/components/FrameReorderControls.svelte';
  import TimelineScrubber from '$lib/components/TimelineScrubber.svelte';
  import PlaybackControls from '$lib/components/PlaybackControls.svelte';
  import CompareView from '$lib/components/CompareView.svelte';

  export let data: { projectId: string };

  let project: { id: string; title: string } | null = null;
  let frames: { id: string; orderIndex: number; title: string; body: string; imageUrl: string | null }[] = [];
  let currentIndex = 0;
  let playing = false;
  let speed = 1;
  let compare = false;
  let aIndex = 0;
  let bIndex = 0;
  let editingFrameId: string | null = null;
  let error = '';
  let timer: number | null = null;

  const projectId = data.projectId;

  async function loadProject() {
    error = '';
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { 'x-user-key': getUserKey() }
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Failed to load project.';
      } else {
        project = data.project;
        frames = data.frames;
        currentIndex = Math.min(currentIndex, Math.max(frames.length - 1, 0));
      }
    } catch (err) {
      error = 'Network error.';
    }
  }

  function stopPlayback() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function togglePlayback() {
    if (!frames.length) return;
    if (playing) {
      playing = false;
      stopPlayback();
    } else {
      playing = true;
      stopPlayback();
      timer = window.setInterval(() => {
        currentIndex = (currentIndex + 1) % frames.length;
      }, 1000 / speed);
    }
  }

  function setSpeed(value: number) {
    speed = value;
    if (playing) {
      togglePlayback();
      togglePlayback();
    }
  }

  function goPrev() {
    if (!frames.length) return;
    currentIndex = (currentIndex - 1 + frames.length) % frames.length;
  }

  function goNext() {
    if (!frames.length) return;
    currentIndex = (currentIndex + 1) % frames.length;
  }

  async function handleSave(frame: any) {
    await loadProject();
    editingFrameId = null;
    if (frame?.id) {
      const idx = frames.findIndex((f) => f.id === frame.id);
      if (idx !== -1) currentIndex = idx;
    }
  }

  async function handleDelete(frameId: string) {
    if (!confirm('Delete this frame?')) return;
    const res = await fetch(`/api/projects/${projectId}/frames/${frameId}`, {
      method: 'DELETE',
      headers: { 'x-user-key': getUserKey() }
    });
    if (res.ok) {
      await loadProject();
    }
  }

  async function handleReorder(order: string[]) {
    const res = await fetch(`/api/projects/${projectId}/frames/reorder`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-key': getUserKey() },
      body: JSON.stringify({ order })
    });
    if (res.ok) {
      await loadProject();
    }
  }

  $: currentFrame = frames[currentIndex];
  $: editingFrame = frames.find((frame) => frame.id === editingFrameId) ?? null;

  onMount(loadProject);
</script>

<main class="grid project-grid">
  <section class="grid">
    <div class="card">
      <h1>{project ? project.title : 'Loading…'}</h1>
      <p class="small">Frames: {frames.length}</p>
      {#if error}
        <p class="small">{error}</p>
      {/if}
    </div>

    <FrameEditor {projectId} frame={editingFrame} onSaved={handleSave} />

    <FrameList
      {frames}
      {currentIndex}
      onSelect={(idx) => (currentIndex = idx)}
      onEdit={(id) => (editingFrameId = id)}
      onDelete={handleDelete}
    />

    <FrameReorderControls
      frames={frames.map((frame) => ({ id: frame.id, title: frame.title }))}
      onReorder={handleReorder}
    />
  </section>

  <section class="grid">
    <TimelineScrubber
      {currentIndex}
      maxIndex={Math.max(frames.length - 1, 0)}
      onScrub={(idx) => (currentIndex = idx)}
    />

    <PlaybackControls
      {playing}
      {speed}
      onToggle={togglePlayback}
      onSpeed={setSpeed}
      onPrev={goPrev}
      onNext={goNext}
    />

    <div class="card">
      <div class="toolbar">
        <h2>Playback</h2>
        <button class="btn secondary" on:click={() => (compare = !compare)}>
          {compare ? 'Hide Compare' : 'Compare A/B'}
        </button>
      </div>
      {#if currentFrame}
        <div class="frame-view">
          <h3>{currentFrame.title || `Frame ${currentIndex + 1}`}</h3>
          <p>{currentFrame.body}</p>
          {#if currentFrame.imageUrl}
            <img class="frame-image" src={currentFrame.imageUrl} alt="Frame" />
          {/if}
        </div>
      {:else}
        <p class="small">No frames yet.</p>
      {/if}
    </div>

    {#if compare}
      <CompareView
        {frames}
        {aIndex}
        {bIndex}
        onChangeA={(idx) => (aIndex = idx)}
        onChangeB={(idx) => (bIndex = idx)}
      />
    {/if}
  </section>
</main>
