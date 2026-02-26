<script lang="ts">
  import type { SurfaceSettings } from '$lib/presets/types';
  import { cssRecipe } from '$lib/render/cssRecipe';

  export let settings: SurfaceSettings;
</script>

<div class="preview" style={cssRecipe(settings).style}></div>
