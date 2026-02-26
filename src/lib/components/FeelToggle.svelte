<script lang="ts">
  export let value = 0;
  export let onChange: (value: number) => void;

  const options = [
    { label: 'Drag', value: -1 },
    { label: 'Neutral', value: 0 },
    { label: 'Flow', value: 1 }
  ];
</script>

<div class="toolbar">
  {#each options as option}
    <button
      class={`btn ${value === option.value ? '' : 'secondary'}`}
      on:click={() => onChange(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>
