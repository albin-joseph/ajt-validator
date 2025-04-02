import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

/**
 * Standard passport issuing countries/authorities
 * ISO 3166-1 alpha-3 country codes for most common passport issuers
 */
export enum PassportAuthority {
  USA = 'USA',
  GBR = 'GBR',
  CAN = 'CAN',
  AUS = 'AUS',
  NZL = 'NZL',
  DEU = 'DEU', // Germany
  FRA = 'FRA',
  ESP = 'ESP', // Spain
  ITA = 'ITA',
  JPN = 'JPN',
  CHN = 'CHN',
  IND = 'IND',
  RUS = 'RUS',
  BRA = 'BRA',
  ZAF = 'ZAF', // South Africa
  // Additional entries can be added as needed
}

/**
 * Common passport formats by country/authority
 * Maps country codes to regex patterns for their passport numbers
 */
export const PASSPORT_FORMATS: Record<string, RegExp> = {
  // United States - 9 digits
  [PassportAuthority.USA]: /^[A-Z0-9]{9}$/,
  
  // United Kingdom - 9 digits (new format)
  [PassportAuthority.GBR]: /^[0-9]{9}$/,
  
  // Canada - 2 letters followed by 6 digits
  [PassportAuthority.CAN]: /^[A-Z]{2}[0-9]{6}$/,
  
  // Australia - 1 letter followed by 7 digits
  [PassportAuthority.AUS]: /^[A-Z][0-9]{7}$/,
  
  // New Zealand - 1 letter followed by 7 digits
  [PassportAuthority.NZL]: /^[A-Z][0-9]{7}$/,
  
  // Germany - 10 characters (letters and numbers)
  [PassportAuthority.DEU]: /^[A-Z0-9]{10}$/,
  
  // France - 9 digits
  [PassportAuthority.FRA]: /^[0-9]{9}$/,
  
  // Spain - 3 letters followed by 6 digits
  [PassportAuthority.ESP]: /^[A-Z]{3}[0-9]{6}$/,
  
  // Italy - 2 letters followed by 7 digits
  [PassportAuthority.ITA]: /^[A-Z]{2}[0-9]{7}$/,
  
  // Japan - 2 letters followed by 7 digits
  [PassportAuthority.JPN]: /^[A-Z]{2}[0-9]{7}$/,
  
  // China - 'G' followed by 8 digits or 'E' followed by 8 digits
  [PassportAuthority.CHN]: /^[EG][0-9]{8}$/,
  
  // India - 1 letter followed by 7 digits
  [PassportAuthority.IND]: /^[A-Z][0-9]{7}$/,
  
  // Russia - 9 digits
  [PassportAuthority.RUS]: /^[0-9]{9}$/,
  
  // Brazil - 2 letters followed by 6 digits
  [PassportAuthority.BRA]: /^[A-Z]{2}[0-9]{6}$/,
  
  // South Africa - 1 letter followed by 8 digits
  [PassportAuthority.ZAF]: /^[A-Z][0-9]{8}$/,
  
  // Generic format for other countries (more permissive)
  generic: /^[A-Z0-9]{5,12}$/
};

/**
 * Options for configuring passport validation
 */
export interface PassportValidatorOptions {
  /** List of allowed issuing authorities (countries) */
  allowedAuthorities?: string[];
  /** Whether passport numbers should be normalized (e.g., uppercase, trimmed) */
  normalize?: boolean;
  /** Whether to validate expiration date */
  validateExpiration?: boolean;
  /** Minimum validity period (in days) if checking expiration */
  minimumValidityDays?: number;
  /** Additional formats for passport validation */
  additionalFormats?: Record<string, RegExp>;
  /** Whether to check for checksums/validation digits (when supported) */
  validateChecksums?: boolean;
  /** Maximum age of passport (in years) */
  maxPassportAge?: number;
  /** Whether to allow unknown authorities (using generic validation) */
  allowUnknownAuthorities?: boolean;
}

/**
 * Result of passport validation with additional metadata
 */
export interface PassportValidationResult extends ValidationResult<string> {
  /** The recognized issuing authority/country if identified */
  authority?: string;
  /** Whether the passport has sufficient remaining validity */
  hasValidExpiration?: boolean;
  /** Days remaining until expiration (if validateExpiration is true) */
  daysToExpiration?: number;
  /** The normalized passport number (if normalization is enabled) */
  normalizedValue?: string;
  /** Whether the passport passed checksum validation */
  checksumValid?: boolean;
}

/**
 * Validator for passport number fields
 * Supports various passport formats and validation rules by country
 */
export class PassportValidator extends BaseValidator<string, string> {
  private options: PassportValidatorOptions;
  private formats: Record<string, RegExp>;

  /**
   * Create a new passport validator
   * @param options Configuration options
   */
  constructor(options: PassportValidatorOptions = {}) {
    super();
    
    // Initialize default options
    this.options = {
      allowedAuthorities: Object.values(PassportAuthority),
      normalize: true,
      validateExpiration: false,
      minimumValidityDays: 180, // 6 months
      validateChecksums: false,
      maxPassportAge: 10, // Most passports are valid for 10 years
      allowUnknownAuthorities: true,
      ...options
    };
    
    // Combine standard formats with any additional formats
    this.formats = {
      ...PASSPORT_FORMATS,
      ...(this.options.additionalFormats || {})
    };
  }

  /**
   * Validate a passport number and optional expiration date
   * @param value Passport number or object with number and expiration
   * @returns Validation result with additional metadata
   */
  validate(value: any): PassportValidationResult {
    // Handle null/empty values
    if (value === null || value === undefined || value === '') {
      return this.createError('PASSPORT_REQUIRED', 'Passport information is required');
    }
    
    let passportNumber: string;
    let expirationDate: Date | undefined;
    let issuingAuthority: string | undefined;
    
    // Handle object input with number and expiration
    if (typeof value === 'object') {
      passportNumber = value.number;
      expirationDate = value.expirationDate ? new Date(value.expirationDate) : undefined;
      issuingAuthority = value.authority;
      
      if (!passportNumber) {
        return this.createError('PASSPORT_NUMBER_REQUIRED', 'Passport number is required');
      }
    } else {
      // Simple string input
      passportNumber = String(value);
    }
    
    let normalizedNumber = passportNumber;
    
    // Normalize if enabled
    if (this.options.normalize) {
      normalizedNumber = passportNumber.trim().toUpperCase();
    }
    
    // Determine the authority if not provided
    const authority = issuingAuthority || this.detectAuthority(normalizedNumber);
    
    // Validate against known format if authority is recognized
    if (authority) {
      // Check if this authority is allowed
      if (this.options.allowedAuthorities && 
          !this.options.allowedAuthorities.includes(authority)) {
        return this.createError(
          'PASSPORT_AUTHORITY_NOT_ALLOWED',
          `Passport issuing authority ${authority} is not in the list of allowed authorities`
        );
      }
      
      // Validate format
      if (!this.validateFormat(normalizedNumber, authority)) {
        return this.createError(
          'INVALID_PASSPORT_FORMAT',
          `Passport number format is invalid for ${authority}`
        );
      }
      
      // Validate checksum if enabled and supported
      if (this.options.validateChecksums) {
        const checksumValid = this.validateChecksum(normalizedNumber, authority);
        if (checksumValid === false) { // Only fail if explicitly invalid, not if unsupported
          return this.createError(
            'INVALID_PASSPORT_CHECKSUM',
            `Passport number checksum validation failed for ${authority}`
          );
        }
      }
    } else if (!this.options.allowUnknownAuthorities) {
      // Unknown authority and not allowed
      return this.createError(
        'UNKNOWN_PASSPORT_AUTHORITY',
        'Could not determine passport issuing authority and unknown authorities are not allowed'
      );
    } else {
      // Unknown authority but allowed using generic validation
      if (!this.validateFormat(normalizedNumber, 'generic')) {
        return this.createError(
          'INVALID_PASSPORT_FORMAT',
          'Passport number format is invalid for generic validation'
        );
      }
    }
    
    // Validate expiration if enabled and date provided
    let hasValidExpiration = undefined;
    let daysToExpiration = undefined;
    
    if (this.options.validateExpiration && expirationDate) {
      // Check if date is valid
      if (isNaN(expirationDate.getTime())) {
        return this.createError(
          'INVALID_EXPIRATION_DATE',
          'Passport expiration date is invalid'
        );
      }
      
      // Calculate days to expiration
      const today = new Date();
      const diffTime = expirationDate.getTime() - today.getTime();
      daysToExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      hasValidExpiration = daysToExpiration >= this.options.minimumValidityDays!;
      
      if (!hasValidExpiration) {
        return this.createError(
          'INSUFFICIENT_PASSPORT_VALIDITY',
          `Passport must be valid for at least ${this.options.minimumValidityDays} more days`
        );
      }
      
      // Check max passport age if issue date is present
      if (this.options.maxPassportAge && value.issueDate) {
        const issueDate = new Date(value.issueDate);
        if (!isNaN(issueDate.getTime())) {
          const passportAgeMs = today.getTime() - issueDate.getTime();
          const passportAgeYears = passportAgeMs / (1000 * 60 * 60 * 24 * 365);
          
          if (passportAgeYears > this.options.maxPassportAge) {
            return this.createError(
              'PASSPORT_TOO_OLD',
              `Passport exceeds maximum age of ${this.options.maxPassportAge} years`
            );
          }
        }
      }
    }
    
    // All validations passed
    return {
      isValid: true,
      value: passportNumber,
      normalizedValue: normalizedNumber,
      authority,
      hasValidExpiration,
      daysToExpiration,
      checksumValid: this.options.validateChecksums ? 
        this.validateChecksum(normalizedNumber, authority) : undefined
    };
  }

  /**
   * Attempt to detect the issuing authority from passport number format
   * @param passportNumber Normalized passport number
   * @returns Detected authority code or undefined
   */
  private detectAuthority(passportNumber: string): string | undefined {
    // Try to match against known formats
    for (const [authority, regex] of Object.entries(this.formats)) {
      if (authority !== 'generic' && regex.test(passportNumber)) {
        return authority;
      }
    }
    
    // Some specific format detection heuristics
    if (/^[0-9]{9}$/.test(passportNumber)) {
      // Could be USA, GBR, FRA, RUS - might need additional checks
      return undefined; // Too ambiguous
    }
    
    // No match found
    return undefined;
  }

  /**
   * Validate passport number format against country-specific pattern
   * @param passportNumber Normalized passport number
   * @param authority Authority code to validate against
   * @returns Whether the format is valid
   */
  private validateFormat(passportNumber: string, authority: string): boolean {
    const format = this.formats[authority] || this.formats.generic;
    return format.test(passportNumber);
  }

  /**
   * Validate passport number checksum (when supported)
   * Note: Actual checksum validation varies by country and may require 
   * complex algorithms that are only available to official systems
   * 
   * @param passportNumber Normalized passport number
   * @param authority Authority code
   * @returns Boolean if supported, undefined if not supported
   */
  private validateChecksum(passportNumber: string, authority?: string): boolean | undefined {
    // This is a simplified implementation - real implementations would need
    // country-specific checksum algorithms
    
    switch(authority) {
      case PassportAuthority.USA:
        // Simplified example - not the actual algorithm
        return this.checkAlphanumericSum(passportNumber);
      
      case PassportAuthority.GBR:
        // Simplified example - not the actual algorithm
        return this.checkDigitSum(passportNumber);
      
      // Add other country-specific checksum validation as needed
      
      default:
        // No checksum validation available for this authority
        return undefined;
    }
  }

  /**
   * Example checksum validation method (simplified)
   * @param value String value to check
   * @returns Whether the checksum is valid
   */
  private checkAlphanumericSum(value: string): boolean {
    // This is a simplified demonstration and not a real passport checksum algorithm
    const sum = Array.from(value).reduce((acc, char) => {
      return acc + (char.charCodeAt(0) % 10);
    }, 0);
    
    return sum % 10 === 0;
  }

  /**
   * Example checksum for numeric values (simplified)
   * @param value String of digits
   * @returns Whether the checksum is valid
   */
  private checkDigitSum(value: string): boolean {
    // This is a simplified demonstration and not a real passport checksum algorithm
    const sum = Array.from(value).reduce((acc, digit) => {
      return acc + parseInt(digit, 10);
    }, 0);
    
    return sum % 10 === 0;
  }

  /**
   * Get all supported passport authorities
   * @returns List of supported authority codes
   */
  getSupportedAuthorities(): string[] {
    return Object.keys(this.formats).filter(key => key !== 'generic');
  }

  /**
   * Create an error result for passport validation
   */
  protected createError(code: string, message: string): PassportValidationResult {
    return {
      isValid: false,
      errors: [{ code, message }]
    };
  }
}