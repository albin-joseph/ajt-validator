import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface PhoneValidatorOptions {
  allowedCountryCodes?: string[];
  requireCountryCode?: boolean;
  minLength?: number;
  maxLength?: number;
  allowExtension?: boolean;
}

export type PhoneValidationResult = ValidationResult<string>;

export class PhoneValidator extends BaseValidator<string> {
  private options: PhoneValidatorOptions;
  
  // Basic international phone format pattern
  private basicPhonePattern = /^[+]?[0-9\s-()]+$/;
  
  // Pattern for phone with country code
  private phoneWithCountryCodePattern = /^\+[1-9][0-9]{0,2}[0-9\s-()]+$/;

  constructor(options: PhoneValidatorOptions = {}) {
    super();
    this.options = {
      allowedCountryCodes: [],
      requireCountryCode: false,
      minLength: 7, // Minimum length without country code
      maxLength: 15, // Maximum length according to E.164 standard
      allowExtension: true,
      ...options
    };
  }

  validate(phone: string): PhoneValidationResult {
    if (!phone) {
      return this.createError('PHONE_REQUIRED', 'Phone number is required');
    }

    // Remove all non-digit characters for counting and checks
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Basic format validation
    if (!this.basicPhonePattern.test(phone)) {
      return this.createError(
        'INVALID_PHONE_FORMAT',
        'Phone number format is invalid'
      );
    }

    // Check if a country code is required
    if (this.options.requireCountryCode && !phone.startsWith('+')) {
      return this.createError(
        'COUNTRY_CODE_REQUIRED',
        'Phone number must include a country code (e.g., +1)'
      );
    }

    // Validate allowed country codes if specified
    if (phone.startsWith('+') && this.options.allowedCountryCodes && this.options.allowedCountryCodes.length > 0) {
      const countryCodeMatch = phone.match(/^\+([0-9]{1,3})/);
      if (countryCodeMatch) {
        const countryCode = countryCodeMatch[1];
        if (!this.options.allowedCountryCodes.includes(countryCode)) {
          return this.createError(
            'COUNTRY_CODE_NOT_ALLOWED',
            'Phone number country code is not in the list of allowed country codes'
          );
        }
      }
    }

    // Check phone length
    if (digitsOnly.length < this.options.minLength!) {
      return this.createError(
        'PHONE_TOO_SHORT',
        `Phone number must have at least ${this.options.minLength} digits`
      );
    }

    if (digitsOnly.length > this.options.maxLength!) {
      // Check if it's an extension and if extensions are allowed
      const parts = phone.split(/[xX]/);
      if (parts.length > 1 && this.options.allowExtension) {
        // It has an extension
        const mainDigits = parts[0].replace(/\D/g, '');
        if (mainDigits.length > this.options.maxLength!) {
          return this.createError(
            'PHONE_TOO_LONG',
            `Phone number must not exceed ${this.options.maxLength} digits (excluding extension)`
          );
        }
      } else {
        return this.createError(
          'PHONE_TOO_LONG',
          `Phone number must not exceed ${this.options.maxLength} digits`
        );
      }
    }

    // Normalize the phone number format
    let normalizedPhone = phone.trim();
    
    // Return success with normalized phone
    return this.createSuccess(normalizedPhone);
  }
}