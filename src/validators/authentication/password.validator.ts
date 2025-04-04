import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface PasswordValidatorOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  specialCharsPattern?: RegExp;
  disallowCommonPasswords?: boolean;
  preventUsernameInPassword?: boolean;
  commonPasswordsArray?: string[];
}

export interface PasswordValidationData {
  password: string;
  username?: string; // optional, for checking if password contains username
}

export type PasswordValidationResult = ValidationResult<string>;

export class PasswordValidator extends BaseValidator<string> {
  private options: PasswordValidatorOptions;

  constructor(options: PasswordValidatorOptions = {}) {
    super();
    this.options = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialCharsPattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/,
      disallowCommonPasswords: true,
      preventUsernameInPassword: true,
      commonPasswordsArray: ['password', '123456', 'qwerty', 'admin'],
      ...options
    };
  }

  validate(passwordData: string | PasswordValidationData): PasswordValidationResult {
    // Handle string input or object input
    let password: string;
    let username: string | undefined;
    
    if (typeof passwordData === 'string') {
      password = passwordData;
    } else {
      password = passwordData.password;
      username = passwordData.username;
    }

    if (!password) {
      return this.createError('PASSWORD_REQUIRED', 'Password is required');
    }

    // Length validation
    if (password.length < this.options.minLength!) {
      return this.createError(
        'PASSWORD_TOO_SHORT',
        `Password must be at least ${this.options.minLength} characters`
      );
    }

    if (password.length > this.options.maxLength!) {
      return this.createError(
        'PASSWORD_TOO_LONG',
        `Password must not exceed ${this.options.maxLength} characters`
      );
    }

    // Uppercase letters check
    if (this.options.requireUppercase && !/[A-Z]/.test(password)) {
      return this.createError(
        'PASSWORD_REQUIRES_UPPERCASE',
        'Password must contain at least one uppercase letter'
      );
    }

    // Lowercase letters check
    if (this.options.requireLowercase && !/[a-z]/.test(password)) {
      return this.createError(
        'PASSWORD_REQUIRES_LOWERCASE',
        'Password must contain at least one lowercase letter'
      );
    }

    // Numbers check
    if (this.options.requireNumbers && !/[0-9]/.test(password)) {
      return this.createError(
        'PASSWORD_REQUIRES_NUMBER',
        'Password must contain at least one number'
      );
    }

    // Special characters check
    if (this.options.requireSpecialChars && !this.options.specialCharsPattern!.test(password)) {
      return this.createError(
        'PASSWORD_REQUIRES_SPECIAL_CHAR',
        'Password must contain at least one special character'
      );
    }

    // Check if password is in common passwords list
    if (
      this.options.disallowCommonPasswords && 
      this.options.commonPasswordsArray &&
      this.options.commonPasswordsArray.includes(password.toLowerCase())
    ) {
      return this.createError(
        'PASSWORD_TOO_COMMON',
        'Password is too common and easily guessed'
      );
    }

    // Check if password contains username
    if (
      this.options.preventUsernameInPassword && 
      username && 
      username.length > 2 && 
      password.toLowerCase().includes(username.toLowerCase())
    ) {
      return this.createError(
        'PASSWORD_CONTAINS_USERNAME',
        'Password should not contain your username'
      );
    }

    return this.createSuccess(password);
  }
}