type ValidationResult = {
  errors: string[];
  normalizedKind: string;
  normalizedExternalId: string;
};

const KIND_REQUIREMENTS: Record<string, string[]> = {
  stop: ['address'],
  exhibit: ['title', 'summary', 'tags', 'body'],
};

export function validatePayload(input: any): ValidationResult {
  const errors: string[] = [];
  const kind = typeof input?.kind === 'string' ? input.kind.trim().toLowerCase() : '';
  const externalId =
    typeof input?.externalId === 'string' ? input.externalId.trim() : '';

  if (!kind) errors.push('kind is required');
  if (kind.length > 32) errors.push('kind must be <= 32 chars');
  if (!input?.content || typeof input.content !== 'object' || Array.isArray(input.content)) {
    errors.push('content must be an object');
  }

  const requiredFields = KIND_REQUIREMENTS[kind] || [];
  if (requiredFields.length && input?.content && typeof input.content === 'object') {
    for (const field of requiredFields) {
      const value = input.content[field];
      if (field === 'tags') {
        if (!Array.isArray(value) || value.length === 0) errors.push('tags must be a non-empty array');
        continue;
      }
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is required`);
      }
    }
  }

  return {
    errors,
    normalizedKind: kind,
    normalizedExternalId: externalId,
  };
}
