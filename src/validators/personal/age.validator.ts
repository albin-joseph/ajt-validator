// src/validators/personal/age.validator.ts
import { BaseValidator } from '../base';
import { ValidationResult } from '../../interfaces';

/**
 * Options for configuring the age validation
 */
export interface AgeValidatorOptions {
  /** Minimum age allowed (inclusive) */
  minAge?: number;
  /** Maximum age allowed (inclusive) */
  maxAge?: number;
  /** Whether to allow decimal ages (e.g., 18.5 years) */
  allowDecimals?: boolean;
  /** Additional validation for specific ranges */
  ageRanges?: {
    /** Name of the range category (e.g., "child", "adult", "senior") */
    name: string;
    /** Minimum age for this range (inclusive) */
    min: number;
    /** Maximum age for this range (inclusive) */
    max: number;
  }[];
  /** Whether to validate age based on date of birth and current date */
  validateFromDate?: boolean;
}

/**
 * Result of age validation with additional metadata
 */
export interface AgeValidationResult extends ValidationResult<number> {
  /** Range category the age falls into, if defined in options */
  ageCategory?: string;
  /** Age calculated from date of birth, if provided */
  calculatedAge?: number;
  /** Years, months, days representation (for detailed age) */
  detailed?: {
    years: number;
    months: number;
    days: number;
  };
}

/**
 * Validator for age fields
 * Can validate ages as numbers or calculate from dates
 */
export class AgeValidator extends BaseValidator<number | Date, number> {
  private options: AgeValidatorOptions;

  /**
   * Create a new age validator
   * @param options Configuration options for age validation
   */
  constructor(options: AgeValidatorOptions = {}) {
    super();
    this.options = {
      minAge: 0,
      maxAge: 120,
      allowDecimals: false,
      validateFromDate: false,
      ...options
    };
  }

  /**
   * Validate an age value or calculate and validate from birth date
   * @param value Age as number or birth date
   * @returns Validation result with additional age metadata
   */
  validate(value: number | Date): AgeValidationResult {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return this.createError('AGE_REQUIRED', 'Age is required');
    }

    let age: number;
    let detailed: { years: number; months: number; days: number } | undefined;

    // Calculate age from date if needed
    if (value instanceof Date) {
      if (!this.options.validateFromDate) {
        return this.createError('DATE_NOT_ALLOWED', 'Expected age as number, received date');
      }

      const { calculatedAge, detailedAge } = this.calculateAgeFromDate(value);
      age = calculatedAge;
      detailed = detailedAge;
    } else {
      // Direct age validation
      age = value;
    }

    // Check if age is a number
    if (typeof age !== 'number' || isNaN(age)) {
      return this.createError('INVALID_AGE', 'Age must be a valid number');
    }

    // Check for decimals if not allowed
    if (!this.options.allowDecimals && !Number.isInteger(age)) {
      return this.createError('DECIMALS_NOT_ALLOWED', 'Age must be a whole number');
    }

    // Validate minimum age
    if (age < this.options.minAge!) {
      return this.createError(
        'AGE_BELOW_MINIMUM',
        `Age must be at least ${this.options.minAge} years`
      );
    }

    // Validate maximum age
    if (age > this.options.maxAge!) {
      return this.createError(
        'AGE_ABOVE_MAXIMUM',
        `Age must not exceed ${this.options.maxAge} years`
      );
    }

    // Determine age category if ranges are defined
    let ageCategory: string | undefined;
    if (this.options.ageRanges && this.options.ageRanges.length > 0) {
      const matchingRange = this.options.ageRanges.find(
        range => age >= range.min && age <= range.max
      );
      ageCategory = matchingRange?.name;
    }

    // Return successful validation result with metadata
    return {
      isValid: true,
      value: age,
      ageCategory,
      calculatedAge: value instanceof Date ? age : undefined,
      detailed
    };
  }

  /**
   * Validate age range category
   * @param age Age to validate
   * @param categoryName Name of the category to check
   * @returns Whether the age falls into the specified category
   */
  isInAgeRange(age: number, categoryName: string): boolean {
    if (!this.options.ageRanges) return false;
    
    const range = this.options.ageRanges.find(r => r.name === categoryName);
    if (!range) return false;
    
    return age >= range.min && age <= range.max;
  }

  /**
   * Calculate age from birth date
   * @param birthDate Date of birth
   * @returns Calculated age in years and detailed breakdown
   */
  private calculateAgeFromDate(birthDate: Date): { 
    calculatedAge: number; 
    detailedAge: { years: number; months: number; days: number; } 
  } {
    const today = new Date();
    
    // Basic validation of the date
    if (birthDate > today) {
      throw new Error('Birth date cannot be in the future');
    }
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    // Adjust for negative days (borrowed from previous month)
    if (days < 0) {
      months--;
      // Get the last day of the previous month
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    // Adjust for negative months (borrowed from previous year)
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Calculate decimal age if needed
    let calculatedAge = years;
    if (this.options.allowDecimals) {
      // Approximate decimal by adding fraction of year completed
      calculatedAge = years + (months / 12) + (days / 365.25);
      // Round to 2 decimal places
      calculatedAge = Math.round(calculatedAge * 100) / 100;
    }
    
    return {
      calculatedAge,
      detailedAge: { years, months, days }
    };
  }

  /**
   * Create an error result for age validation
   */
  protected createError(code: string, message: string): AgeValidationResult {
    return {
      isValid: false,
      errors: [{ code, message }]
    };
  }
}
