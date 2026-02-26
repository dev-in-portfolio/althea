export type SessionInput = {
  startedAt: string;
  endedAt: string;
  duration: number;
  tag: string;
  feel: number;
  notes?: string;
};

export function validateSession(input: SessionInput) {
  const started = new Date(input.startedAt);
  const ended = new Date(input.endedAt);
  if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) {
    return 'Invalid timestamps.';
  }
  if (started >= ended) return 'Start must be before end.';
  if (!Number.isFinite(input.duration) || input.duration < 1 || input.duration > 86400) {
    return 'Duration must be between 1s and 24h.';
  }
  if (![ -1, 0, 1 ].includes(input.feel)) return 'Feel must be -1, 0, or 1.';
  if (!input.tag || input.tag.trim().length < 1 || input.tag.trim().length > 40) {
    return 'Tag must be 1–40 characters.';
  }
  if (input.notes && input.notes.trim().length > 400) {
    return 'Notes must be 400 characters or fewer.';
  }
  return '';
}

export function validatePartial(input: Partial<SessionInput>) {
  if (input.tag !== undefined && (input.tag.trim().length < 1 || input.tag.trim().length > 40)) {
    return 'Tag must be 1–40 characters.';
  }
  if (input.feel !== undefined && ![-1, 0, 1].includes(input.feel)) {
    return 'Feel must be -1, 0, or 1.';
  }
  if (input.duration !== undefined && (input.duration < 1 || input.duration > 86400)) {
    return 'Duration must be between 1s and 24h.';
  }
  if (input.startedAt && Number.isNaN(new Date(input.startedAt).getTime())) {
    return 'Invalid startedAt.';
  }
  if (input.endedAt && Number.isNaN(new Date(input.endedAt).getTime())) {
    return 'Invalid endedAt.';
  }
  if (input.notes !== undefined && input.notes.trim().length > 400) {
    return 'Notes must be 400 characters or fewer.';
  }
  if (input.startedAt && input.endedAt) {
    if (new Date(input.startedAt) >= new Date(input.endedAt)) return 'Start must be before end.';
  }
  return '';
}
