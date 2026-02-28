export type Item = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  score: number;
  createdAt: string;
};

const seedTags = ["signal", "archive", "atlas", "index", "field", "relay", "grid"];

export const items: Item[] = Array.from({ length: 60 }).map((_, index) => {
  const createdAt = new Date(Date.now() - index * 36 * 60 * 60 * 1000).toISOString();
  return {
    id: `item-${index + 1}`,
    title: `Island Record ${index + 1}`,
    summary: "Curated content snapshot with lightweight metadata for fast indexing.",
    tags: [seedTags[index % seedTags.length], seedTags[(index + 2) % seedTags.length]],
    score: 40 + (index % 60),
    createdAt,
  };
});
