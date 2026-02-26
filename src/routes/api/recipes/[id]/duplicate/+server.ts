import { json } from '@sveltejs/kit';
import { duplicateRecipe } from '$lib/server/recipes';

export async function POST({ params, locals }) {
  try {
    const recipe = await duplicateRecipe(locals.userKey as string, params.id);
    if (!recipe) return json({ error: 'Not found' }, { status: 404 });
    return json(recipe);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Database unavailable.' }, { status: 503 });
  }
}
