// src/validators/emailValidator.ts

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' && emailRegex.test(value);
}
