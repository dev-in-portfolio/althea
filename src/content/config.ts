import { defineCollection, z } from "astro:content";

const terms = defineCollection({
  type: "content",
  schema: z.object({
    term: z.string(),
    slug: z.string().optional(),
    category: z.enum(["BOH", "FOH", "MANAGEMENT", "INVENTORY", "SERVICE", "GENERAL"]),
    techEquivalent: z.array(z.string()),
    definitionRestaurant: z.string(),
    definitionTech: z.string(),
    examplesRestaurant: z.array(z.string()),
    examplesTech: z.array(z.string()),
    tags: z.array(z.string()),
    related: z.array(z.string())
  })
});

export const collections = { terms };
