import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface TwoFactorValidatorOptions {
  digitOnly?: boolean;
  exactLength?: number;
  allowedTypes?: Array<'totp' | 'sms' | 'email' | 'app'>;
  expiration?: number; // In seconds
}

export interface TwoFactorData {
  code: string;
  type?: 'totp' | 'sms' | 'email' | 'app';
  timestamp?: number;
}

export type TwoFactorValidationResult = ValidationResult<TwoFactorData>;

export class TwoFactorValidator extends BaseValidator<TwoFactorData> {
  private options: TwoFactorValidatorOptions;
  private digitPattern = /^\d+$/;

  constructor(options: TwoFactorValidatorOptions = {}) {
    super();
    this.options = {
      digitOnly: true,
      exactLength: 6,
      allowedTypes: ['totp', 'sms', 'email', 'app'],
      expiration: 300, // 5 minutes default
      ...options
    };
  }

  validate(twoFactorData: TwoFactorData): TwoFactorValidationResult {
    if (!twoFactorData) {
      return this.createError('TWOFACTOR_REQUIRED', 'Two-factor authentication data is required');
    }

    if (!twoFactorData.code) {
      return this.createError('TWOFACTOR_CODE_REQUIRED', 'Two-factor authentication code is required');
    }

    // Length validation
    if (this.options.exactLength && twoFactorData.code.length !== this.options.exactLength) {
      return this.createError(
        'INVALID_TWOFACTOR_LENGTH',
        `Two-factor code must be exactly ${this.options.exactLength} characters`
      );
    }

    // Check if digits only
    if (this.options.digitOnly && !this.digitPattern.test(twoFactorData.code)) {
      return this.createError(
        'INVALID_TWOFACTOR_FORMAT',
        'Two-factor code must contain only digits'
      );
    }

    // Validate the type if provided
    if (
      twoFactorData.type && 
      this.options.allowedTypes &&
      !this.options.allowedTypes.includes(twoFactorData.type)
    ) {
      return this.createError(
        'INVALID_TWOFACTOR_TYPE',
        `Two-factor type must be one of: ${this.options.allowedTypes.join(', ')}`
      );
    }

    // Check expiration if timestamp provided
    if (twoFactorData.timestamp && this.options.expiration) {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = twoFactorData.timestamp + this.options.expiration;
      
      if (currentTime > expirationTime) {
        return this.createError(
          'TWOFACTOR_EXPIRED',
          'Two-factor code has expired'
        );
      }
    }

    return this.createSuccess({
      code: twoFactorData.code.trim(),
      type: twoFactorData.type,
      timestamp: twoFactorData.timestamp
    });
  }
}