import { defineCollection, z } from "astro:content";

const paradoxes = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    type: z.enum(["PARADOX", "THOUGHT_EXPERIMENT", "SYSTEM", "RIDDLE"]),
    summary: z.string(),
    tags: z.array(z.string()),
    axioms: z.array(z.string()),
    contradictions: z.array(z.string()),
    related: z.array(z.string()),
    prompts: z.array(z.string()),
    sources: z.array(z.string()).optional()
  })
});

export const collections = { paradoxes };
