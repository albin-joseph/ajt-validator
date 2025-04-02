import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface NameValidatorOptions {
    minLength?: number;
    maxLength?: number;
    allowSpecialChars?: boolean;
  }
  
  export class NameValidator extends BaseValidator<string> {
    private options: NameValidatorOptions;
  
    constructor(options: NameValidatorOptions = {}) {
      super();
      this.options = {
        minLength: 2,
        maxLength: 50,
        allowSpecialChars: false,
        ...options
      };
    }
  
    validate(name: string): ValidationResult<string> {
      if (!name) {
        return this.createError('NAME_REQUIRED', 'Name is required');
      }
  
      if (name.length < this.options.minLength!) {
        return this.createError(
          'NAME_TOO_SHORT',
          `Name must be at least ${this.options.minLength} characters`
        );
      }
  
      if (name.length > this.options.maxLength!) {
        return this.createError(
          'NAME_TOO_LONG',
          `Name must not exceed ${this.options.maxLength} characters`
        );
      }
  
      const namePattern = this.options.allowSpecialChars
        ? /^[a-zA-Z\s'-]+$/
        : /^[a-zA-Z\s]+$/;
  
      if (!namePattern.test(name)) {
        return this.createError(
          'INVALID_NAME_FORMAT',
          'Name contains invalid characters'
        );
      }
  
      return this.createSuccess(name.trim());
    }
  }