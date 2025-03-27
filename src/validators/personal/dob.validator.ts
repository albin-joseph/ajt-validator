import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

/**
 * Options for configuring the Date of Birth validation
 */
export interface DOBValidatorOptions {
  /** Minimum age allowed (in years) */
  minAge?: number;
  /** Maximum age allowed (in years) */
  maxAge?: number;
  /** Whether to allow future dates */
  allowFutureDates?: boolean;
  /** Reference date to use instead of current date for age calculations */
  referenceDate?: Date;
  /** Specific valid date ranges */
  validRanges?: {
    /** Name of the range */
    name: string;
    /** Start date of valid range (inclusive) */
    startDate: Date;
    /** End date of valid range (inclusive) */
    endDate: Date;
  }[];
  /** Format validation options */
  format?: {
    /** Whether to strictly validate the format */
    strict?: boolean;
    /** Allowed formats (YYYY-MM-DD, MM/DD/YYYY, etc.) */
    allowedFormats?: string[];
  };
}

/**
 * Result of DOB validation with additional metadata
 */
export interface DOBValidationResult extends ValidationResult<Date> {
  /** Age calculated from the DOB */
  age: {
    /** Age in years */
    years: number;
    /** Age in months */
    months: number;
    /** Age in days */
    days: number;
    /** Total age in decimal years */
    decimalYears: number;
  } | undefined;
  /** Category the DOB falls into, if defined in ranges */
  category?: string;
  /** Whether the person is of legal age (based on minAge) */
  isLegalAge?: boolean;
}

/**
 * Validator for Date of Birth fields
 * Validates dates and provides age calculations
 */
export class DOBValidator extends BaseValidator<string | Date, Date> {
  private options: DOBValidatorOptions;
  private readonly DEFAULT_MIN_AGE = 0;
  private readonly DEFAULT_MAX_AGE = 120;

  /**
   * Create a new Date of Birth validator
   * @param options Configuration options for DOB validation
   */
  constructor(options: DOBValidatorOptions = {}) {
    super();
    this.options = {
      minAge: this.DEFAULT_MIN_AGE,
      maxAge: this.DEFAULT_MAX_AGE,
      allowFutureDates: false,
      ...options
    };
  }

  /**
   * Validate a date of birth value
   * @param value DOB as string or Date object
   * @returns Validation result with additional DOB and age metadata
   */
  validate(value: string | Date): DOBValidationResult {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return this.createError('DOB_REQUIRED', 'Date of birth is required');
    }

    // Parse the date if it's a string
    let dateObj: Date;
    if (typeof value === 'string') {
      dateObj = this.parseDate(value);
      if (isNaN(dateObj.getTime())) {
        return this.createError('INVALID_DATE_FORMAT', 'Invalid date format');
      }
    } else if (value instanceof Date) {
      dateObj = value;
      // Validate that it's a valid date
      if (isNaN(dateObj.getTime())) {
        return this.createError('INVALID_DATE', 'Invalid date');
      }
    } else {
      return this.createError('INVALID_INPUT_TYPE', 'Date of birth must be a string or Date object');
    }

    // Get reference date (today by default)
    const referenceDate = this.options.referenceDate || new Date();

    // Check for future dates
    if (!this.options.allowFutureDates && dateObj > referenceDate) {
      return this.createError('FUTURE_DATE', 'Date of birth cannot be in the future');
    }

    // Calculate age
    const age = this.calculateAge(dateObj, referenceDate);

    // Validate minimum age
    if (age.years < this.options.minAge!) {
      return this.createError(
        'BELOW_MINIMUM_AGE',
        `Age must be at least ${this.options.minAge} years`
      );
    }

    // Validate maximum age
    if (age.years > this.options.maxAge!) {
      return this.createError(
        'ABOVE_MAXIMUM_AGE',
        `Age must not exceed ${this.options.maxAge} years`
      );
    }

    // Check if DOB falls within any specified valid ranges
    let category: string | undefined;
    if (this.options.validRanges && this.options.validRanges.length > 0) {
      const matchingRange = this.options.validRanges.find(
        range => dateObj >= range.startDate && dateObj <= range.endDate
      );
      category = matchingRange?.name;
      
      // If valid ranges are specified and DOB doesn't match any, it's invalid
      if (!matchingRange) {
        return this.createError(
          'OUTSIDE_VALID_RANGES',
          'Date of birth does not fall within any valid range'
        );
      }
    }

    // Return successful validation result with metadata
    return {
      isValid: true,
      value: dateObj,
      age,
      category,
      isLegalAge: age.years >= this.options.minAge!
    };
  }

  /**
   * Check if a person is of legal age based on their DOB
   * @param dob Date of birth
   * @param minAge Minimum age to be considered legal (defaults to options.minAge)
   * @returns Whether the person is of legal age
   */
  isLegalAge(dob: Date, minAge?: number): boolean {
    const minimumAge = minAge || this.options.minAge || 18; // Default to 18 if not specified
    const age = this.calculateAge(dob).years;
    return age >= minimumAge;
  }

  /**
   * Get age at a specific reference date
   * @param dob Date of birth
   * @param referenceDate Date to calculate age at (defaults to current date)
   * @returns Age details
   */
  getAgeAt(dob: Date, referenceDate?: Date): NonNullable<DOBValidationResult['age']> {
    return this.calculateAge(dob, referenceDate);
  }

  /**
   * Calculate exact age from DOB
   * @param dob Date of birth
   * @param referenceDate Reference date (defaults to current date)
   * @returns Detailed age calculation
   */
  private calculateAge(dob: Date, referenceDate: Date = new Date()): {
    years: number;
    months: number;
    days: number;
    decimalYears: number;
  } {
    let years = referenceDate.getFullYear() - dob.getFullYear();
    let months = referenceDate.getMonth() - dob.getMonth();
    let days = referenceDate.getDate() - dob.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      // Get the number of days in the previous month
      const previousMonth = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        0
      ).getDate();
      days += previousMonth;
      months--;
    }
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Calculate decimal years (approximate)
    const daysInYear = 365.25; // Account for leap years
    const decimalYears = years + (months / 12) + (days / daysInYear);
    
    return {
      years,
      months,
      days,
      decimalYears: Math.round(decimalYears * 100) / 100 // Round to 2 decimal places
    };
  }

  /**
   * Parse string date into Date object with format detection
   * @param dateStr Date string
   * @returns Parsed Date object
   */
  private parseDate(dateStr: string): Date {
    // Try to parse with Date constructor first
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // If strict format validation is enabled, check against allowed formats
    if (this.options.format?.strict && this.options.format.allowedFormats) {
      // Implementation would check each allowed format
      // This is simplified - in a real implementation you would need
      // to check each format pattern (perhaps using a library like date-fns)
    }

    // Common formats handling
    // MM/DD/YYYY
    const usFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const usMatch = dateStr.match(usFormat);
    if (usMatch) {
      return new Date(
        parseInt(usMatch[3]), // year
        parseInt(usMatch[1]) - 1, // month (0-based)
        parseInt(usMatch[2]) // day
      );
    }

    // DD/MM/YYYY
    const ukFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ukMatch = dateStr.match(ukFormat);
    if (ukMatch) {
      return new Date(
        parseInt(ukMatch[3]), // year
        parseInt(ukMatch[2]) - 1, // month (0-based)
        parseInt(ukMatch[1]) // day
      );
    }

    // YYYY-MM-DD (ISO format)
    const isoFormat = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    const isoMatch = dateStr.match(isoFormat);
    if (isoMatch) {
      return new Date(
        parseInt(isoMatch[1]), // year
        parseInt(isoMatch[2]) - 1, // month (0-based)
        parseInt(isoMatch[3]) // day
      );
    }

    // If no format matched, return invalid date
    return new Date('Invalid Date');
  }

  /**
   * Create an error result for DOB validation
   */
  protected createError(code: string, message: string): DOBValidationResult {
    return {
      isValid: false,
      errors: [{ code, message }],
      age: undefined
    };
  }
}
