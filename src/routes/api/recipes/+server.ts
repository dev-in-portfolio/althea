import { json } from '@sveltejs/kit';
import { countRecipes, createRecipe, listRecipes } from '$lib/server/recipes';
import { validateName, validateSettings, validateSettingsSize } from '$lib/server/validate';

export async function GET({ locals }) {
  const items = await listRecipes(locals.userKey as string);
  return json({ items });
}

export async function POST({ request, locals }) {
  const body = await request.json();
  const name = String(body.name || '');
  const settings = body.settings;
  const nameError = validateName(name);
  if (nameError) return json({ error: nameError }, { status: 400 });
  const settingsError = validateSettings(settings);
  if (settingsError) return json({ error: settingsError }, { status: 400 });
  const sizeError = validateSettingsSize(settings, 8000);
  if (sizeError) return json({ error: sizeError }, { status: 400 });
  const count = await countRecipes(locals.userKey as string);
  if (count >= 500) return json({ error: 'Max recipes reached.' }, { status: 400 });
  const recipe = await createRecipe(locals.userKey as string, name, settings);
  return json(recipe);
}
