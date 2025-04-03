import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface EmailValidatorOptions {
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxLength?: number;
  strictMode?: boolean;
}

export type EmailValidationResult = ValidationResult<string>;

export class EmailValidator extends BaseValidator<string> {
  private options: EmailValidatorOptions;
  // RFC 5322 compliant email regex pattern in simple mode
  private simpleEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Stricter RFC 5322 compliant email regex pattern
  private strictEmailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  constructor(options: EmailValidatorOptions = {}) {
    super();
    this.options = {
      allowedDomains: [],
      blockedDomains: [],
      maxLength: 254, // Maximum allowed length for an email address according to RFC 5321
      strictMode: false,
      ...options
    };
  }

  validate(email: string): EmailValidationResult {
    if (!email) {
      return this.createError('EMAIL_REQUIRED', 'Email address is required');
    }

    if (email.length > this.options.maxLength!) {
      return this.createError(
        'EMAIL_TOO_LONG',
        `Email must not exceed ${this.options.maxLength} characters`
      );
    }

    // Basic format validation
    const emailPattern = this.options.strictMode 
      ? this.strictEmailPattern 
      : this.simpleEmailPattern;
    
    if (!emailPattern.test(email)) {
      return this.createError(
        'INVALID_EMAIL_FORMAT',
        'Email format is invalid'
      );
    }

    // Domain validation
    const domain = email.split('@')[1].toLowerCase();

    // Check allowed domains if specified
    if (
      this.options.allowedDomains &&
      this.options.allowedDomains.length > 0 &&
      !this.options.allowedDomains.some(allowedDomain => 
        domain === allowedDomain.toLowerCase() || domain.endsWith(`.${allowedDomain.toLowerCase()}`)
      )
    ) {
      return this.createError(
        'DOMAIN_NOT_ALLOWED',
        'Email domain is not in the list of allowed domains'
      );
    }

    // Check blocked domains
    if (
      this.options.blockedDomains &&
      this.options.blockedDomains.length > 0 &&
      this.options.blockedDomains.some(blockedDomain => 
        domain === blockedDomain.toLowerCase() || domain.endsWith(`.${blockedDomain.toLowerCase()}`)
      )
    ) {
      return this.createError(
        'DOMAIN_BLOCKED',
        'Email domain is blocked'
      );
    }

    return this.createSuccess(email.trim().toLowerCase());
  }
}