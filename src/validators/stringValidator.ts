// src/validators/stringValidator.ts

export function isNonEmptyString(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
  