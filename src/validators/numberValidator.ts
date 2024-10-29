// src/validators/numberValidator.ts

export function isPositiveNumber(value: unknown): boolean {
    return typeof value === 'number' && value > 0;
  }
  