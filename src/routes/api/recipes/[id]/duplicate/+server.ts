import { json } from '@sveltejs/kit';
import { duplicateRecipe } from '$lib/server/recipes';

export async function POST({ params, locals }) {
  const recipe = await duplicateRecipe(locals.userKey as string, params.id);
  if (!recipe) return json({ error: 'Not found' }, { status: 404 });
  return json(recipe);
}
