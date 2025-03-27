import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

/**
 * Standard gender options
 */
export enum GenderOption {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say'
}

/**
 * Options for configuring gender validation
 */
export interface GenderValidatorOptions {
  /** List of allowed gender values */
  allowedValues?: string[];
  /** Whether to allow custom/self-described gender entries */
  allowCustom?: boolean;
  /** Maximum length for custom gender entries (if allowed) */
  customMaxLength?: number;
  /** Whether values should be normalized (e.g., lowercase, trimmed) */
  normalize?: boolean;
  /** Whether to use case-sensitive validation */
  caseSensitive?: boolean;
  /** Whether to allow abbreviated values (e.g., 'M', 'F') */
  allowAbbreviations?: boolean;
  /** Map of recognized abbreviations to full values */
  abbreviationMap?: Record<string, string>;
}

/**
 * Result of gender validation with additional metadata
 */
export interface GenderValidationResult extends ValidationResult<string> {
  /** Whether the value matched a standard option */
  isStandardOption?: boolean;
  /** Normalized value (if normalization is enabled) */
  normalizedValue?: string;
  /** Mapped value from abbreviation (if applicable) */
  expandedValue?: string;
}

/**
 * Validator for gender fields
 * Supports standard options, custom entries, and abbreviations
 */
export class GenderValidator extends BaseValidator<string, string> {
  private options: GenderValidatorOptions;
  private standardValues: string[];
  private abbreviations: Record<string, string>;
  private lowercaseAllowedValues: string[] = [];

  /**
   * Create a new gender validator
   * @param options Configuration options
   */
  constructor(options: GenderValidatorOptions = {}) {
    super();
    
    // Set default standard values from enum
    this.standardValues = Object.values(GenderOption);
    
    // Initialize default options
    this.options = {
      allowedValues: this.standardValues,
      allowCustom: false,
      customMaxLength: 50,
      normalize: true,
      caseSensitive: false,
      allowAbbreviations: true,
      ...options
    };
    
    // Default abbreviation mapping
    this.abbreviations = {
      'm': GenderOption.MALE,
      'f': GenderOption.FEMALE,
      'nb': GenderOption.NON_BINARY,
      'o': GenderOption.OTHER,
      'x': GenderOption.OTHER,
      'pnts': GenderOption.PREFER_NOT_TO_SAY,
      'prefer not': GenderOption.PREFER_NOT_TO_SAY,
      ...(this.options.abbreviationMap || {})
    };
    
    // Precompute lowercase allowed values for case-insensitive matching
    if (!this.options.caseSensitive && this.options.allowedValues) {
      this.lowercaseAllowedValues = this.options.allowedValues.map(val => val.toLowerCase());
    }
  }

  /**
   * Validate a gender value
   * @param value Gender string to validate
   * @returns Validation result with additional metadata
   */
  validate(value: any): GenderValidationResult {
    // Check for null/empty/non-string values
    if (value === null || value === undefined || value === '') {
      return this.createError('GENDER_REQUIRED', 'Gender value is required');
    }
    
    // Convert to string if it's not already
    const stringValue = String(value);
    
    let processedValue = stringValue;
    
    // Normalize if enabled
    if (this.options.normalize) {
      processedValue = stringValue.trim();
      if (!this.options.caseSensitive) {
        processedValue = processedValue.toLowerCase();
      }
    }

    // Check if it's a standard or allowed value
    const allowedValues = this.options.allowedValues || this.standardValues;
    const isAllowed = this.checkAllowedValue(processedValue, allowedValues);
    
    if (isAllowed) {
      return {
        isValid: true,
        value: stringValue,
        normalizedValue: processedValue,
        isStandardOption: this.checkIsStandardOption(processedValue)
      };
    }

    // Check abbreviations if enabled
    if (this.options.allowAbbreviations) {
      const expandedValue = this.expandAbbreviation(processedValue);
      if (expandedValue && this.checkAllowedValue(expandedValue, allowedValues)) {
        return {
          isValid: true,
          value: stringValue,
          normalizedValue: processedValue,
          expandedValue,
          isStandardOption: this.checkIsStandardOption(expandedValue)
        };
      }
    }

    // Allow custom value if enabled
    if (this.options.allowCustom) {
      if (processedValue.length > (this.options.customMaxLength || 50)) {
        return this.createError(
          'GENDER_TOO_LONG',
          `Custom gender value cannot exceed ${this.options.customMaxLength} characters`
        );
      }

      return {
        isValid: true,
        value: stringValue,
        normalizedValue: processedValue,
        isStandardOption: false
      };
    }

    // If we get here, the value is not valid
    return this.createError(
      'INVALID_GENDER',
      `Gender must be one of: ${allowedValues.join(', ')}`
    );
  }

  /**
   * Check if value exists in allowed values list
   * @param value Value to check
   * @param allowedValues List of allowed values
   * @returns Whether the value is allowed
   */
  private checkAllowedValue(value: string, allowedValues: string[]): boolean {
    if (this.options.caseSensitive) {
      return allowedValues.indexOf(value) !== -1;
    } else {
      // Use precomputed lowercase values if available
      if (this.lowercaseAllowedValues.length > 0) {
        return this.lowercaseAllowedValues.indexOf(value.toLowerCase()) !== -1;
      }
      
      // Fallback for dynamic allowed values
      return allowedValues.some(allowed => 
        allowed.toLowerCase() === value.toLowerCase()
      );
    }
  }

  /**
   * Check if a value is a standard option
   * @param value Value to check (assumed to be already normalized)
   * @returns Whether the value is a standard option
   */
  private checkIsStandardOption(value: string): boolean {
    if (this.options.caseSensitive) {
      return this.standardValues.indexOf(value) !== -1;
    } else {
      const lowercaseValue = value.toLowerCase();
      return this.standardValues.some(standard => 
        standard.toLowerCase() === lowercaseValue
      );
    }
  }

  /**
   * Expand an abbreviation to its full form
   * @param abbr Abbreviation to expand
   * @returns Expanded value if found, or undefined
   */
  private expandAbbreviation(abbr: string): string | undefined {
    // Direct lookup for case-sensitive mode
    if (this.options.caseSensitive) {
      return this.abbreviations[abbr];
    }
    
    // Case-insensitive lookup
    const lowerAbbr = abbr.toLowerCase();
    
    // First try direct lowercase match
    if (this.abbreviations[lowerAbbr]) {
      return this.abbreviations[lowerAbbr];
    }
    
    // If not found, search for case-insensitive match in keys
    const keys = Object.keys(this.abbreviations);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.toLowerCase() === lowerAbbr) {
        return this.abbreviations[key];
      }
    }
    
    return undefined;
  }

  /**
   * Get all standard gender options
   * @returns List of standard gender values
   */
  getStandardOptions(): string[] {
    return [...this.standardValues];
  }

  /**
   * Get all allowed abbreviations
   * @returns Map of abbreviations to full values
   */
  getAbbreviations(): Record<string, string> {
    return { ...this.abbreviations };
  }

  /**
   * Create an error result for gender validation
   */
  protected createError(code: string, message: string): GenderValidationResult {
    return {
      isValid: false,
      errors: [{ code, message }]
    };
  }
}