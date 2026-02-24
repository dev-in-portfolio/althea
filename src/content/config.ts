import { defineCollection, z } from "astro:content";

const waypoints = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    type: z.enum(["prompt", "story", "tool", "link"]),
    mood: z.enum(["calm", "curious", "tender", "focused", "bright", "grounded"]),
    order: z.number(),
    excerpt: z.string()
  })
});

export const collections = { waypoints };
