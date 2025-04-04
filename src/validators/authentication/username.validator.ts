import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface UsernameValidatorOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  blockedUsernames?: string[];
  allowSpaces?: boolean;
  caseSensitive?: boolean;
}

export type UsernameValidationResult = ValidationResult<string>;

export class UsernameValidator extends BaseValidator<string> {
  private options: UsernameValidatorOptions;

  constructor(options: UsernameValidatorOptions = {}) {
    super();
    this.options = {
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_.-]+$/, // Default allows alphanumeric, underscore, dot, hyphen
      blockedUsernames: ['admin', 'root', 'system', 'moderator'],
      allowSpaces: false,
      caseSensitive: false,
      ...options
    };
  }

  validate(username: string): UsernameValidationResult {
    if (!username) {
      return this.createError('USERNAME_REQUIRED', 'Username is required');
    }

    const processedUsername = this.options.caseSensitive ? username.trim() : username.trim().toLowerCase();

    // Length validation
    if (processedUsername.length < this.options.minLength!) {
      return this.createError(
        'USERNAME_TOO_SHORT',
        `Username must be at least ${this.options.minLength} characters`
      );
    }

    if (processedUsername.length > this.options.maxLength!) {
      return this.createError(
        'USERNAME_TOO_LONG',
        `Username must not exceed ${this.options.maxLength} characters`
      );
    }

    // Check spaces
    if (!this.options.allowSpaces && /\s/.test(processedUsername)) {
      return this.createError(
        'USERNAME_CONTAINS_SPACES',
        'Username cannot contain spaces'
      );
    }

    // Pattern validation
    if (this.options.pattern && !this.options.pattern.test(processedUsername)) {
      return this.createError(
        'INVALID_USERNAME_FORMAT',
        'Username format is invalid. Use only letters, numbers, and the following characters: _ . -'
      );
    }

    // Check blocked usernames
    if (
      this.options.blockedUsernames &&
      this.options.blockedUsernames.length > 0
    ) {
      const compareUsername = this.options.caseSensitive ? processedUsername : processedUsername.toLowerCase();
      const isBlocked = this.options.blockedUsernames.some(blocked => 
        this.options.caseSensitive ? 
          blocked === compareUsername : 
          blocked.toLowerCase() === compareUsername
      );
      
      if (isBlocked) {
        return this.createError(
          'USERNAME_BLOCKED',
          'This username is not allowed'
        );
      }
    }

    return this.createSuccess(
      this.options.caseSensitive ? processedUsername : processedUsername.toLowerCase()
    );
  }
}