import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface ApiKeyValidatorOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  prefixRequired?: string;
  allowedPrefixes?: string[];
}

export type ApiKeyValidationResult = ValidationResult<string>;

export class ApiKeyValidator extends BaseValidator<string> {
  private options: ApiKeyValidatorOptions;

  constructor(options: ApiKeyValidatorOptions = {}) {
    super();
    this.options = {
      minLength: 16,
      maxLength: 64,
      pattern: /^[a-zA-Z0-9_-]+$/,
      prefixRequired: '',
      allowedPrefixes: [],
      ...options
    };
  }

  validate(apiKey: string): ApiKeyValidationResult {
    if (!apiKey) {
      return this.createError('APIKEY_REQUIRED', 'API key is required');
    }

    // Length validation
    if (apiKey.length < this.options.minLength!) {
      return this.createError(
        'APIKEY_TOO_SHORT',
        `API key must be at least ${this.options.minLength} characters`
      );
    }

    if (apiKey.length > this.options.maxLength!) {
      return this.createError(
        'APIKEY_TOO_LONG',
        `API key must not exceed ${this.options.maxLength} characters`
      );
    }

    // Format validation
    if (!this.options.pattern!.test(apiKey)) {
      return this.createError(
        'INVALID_APIKEY_FORMAT',
        'API key format is invalid'
      );
    }

    // Prefix validation
    if (this.options.prefixRequired && !apiKey.startsWith(this.options.prefixRequired)) {
      return this.createError(
        'INVALID_APIKEY_PREFIX',
        `API key must start with ${this.options.prefixRequired}`
      );
    }

    // Check allowed prefixes if specified
    if (
      this.options.allowedPrefixes &&
      this.options.allowedPrefixes.length > 0
    ) {
      const hasValidPrefix = this.options.allowedPrefixes.some(prefix => 
        apiKey.startsWith(prefix)
      );
      
      if (!hasValidPrefix) {
        return this.createError(
          'INVALID_APIKEY_PREFIX',
          'API key prefix is not in the list of allowed prefixes'
        );
      }
    }

    return this.createSuccess(apiKey.trim());
  }
}