export type DemoRow = {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'blocked';
  tag: string;
  updated_at: string;
};

const statuses: DemoRow['status'][] = ['open', 'closed', 'blocked'];
const tags = ['core', 'edge', 'vault', 'signal', 'ops'];

export const demoRows: DemoRow[] = Array.from({ length: 120 }).map((_, index) => ({
  id: `row-${index + 1}`,
  title: `Dataset Item ${index + 1}`,
  status: statuses[index % statuses.length],
  tag: tags[index % tags.length],
  updated_at: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
}));
