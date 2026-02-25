export type EventRecord = {
  id: string;
  happenedAt: string;
  tags: string[];
  context?: Record<string, string> | null;
};

export type Signal = {
  signalType: string;
  headline: string;
  evidence: string;
  confidence: number;
  supportingTags: string[];
  supportingEventIds?: string[];
};
