export type SessionItem = {
  id: string;
  label: string;
  seed: number;
};

export type Comparison = {
  a_item_id: string;
  b_item_id: string;
  winner_item_id: string;
};

export type ScoreRow = {
  id: string;
  label: string;
  seed: number;
  wins: number;
  losses: number;
  score: number;
};
