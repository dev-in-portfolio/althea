import { json } from '@sveltejs/kit';
import { deleteRecipe, getRecipe, updateRecipe } from '$lib/server/recipes';
import { validateName, validateSettings, validateSettingsSize } from '$lib/server/validate';

export async function GET({ params, locals }) {
  const recipe = await getRecipe(locals.userKey as string, params.id);
  if (!recipe) return json({ error: 'Not found' }, { status: 404 });
  return json(recipe);
}

export async function PATCH({ params, request, locals }) {
  const body = await request.json();
  const name = String(body.name || '');
  const settings = body.settings;
  const nameError = validateName(name);
  if (nameError) return json({ error: nameError }, { status: 400 });
  const settingsError = validateSettings(settings);
  if (settingsError) return json({ error: settingsError }, { status: 400 });
  const sizeError = validateSettingsSize(settings, 8000);
  if (sizeError) return json({ error: sizeError }, { status: 400 });
  const ok = await updateRecipe(locals.userKey as string, params.id, name, settings);
  if (!ok) return json({ error: 'Not found' }, { status: 404 });
  return json({ ok: true });
}

export async function DELETE({ params, locals }) {
  const ok = await deleteRecipe(locals.userKey as string, params.id);
  if (!ok) return json({ error: 'Not found' }, { status: 404 });
  return json({ ok: true });
}
