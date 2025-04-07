import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface BankAccountValidatorOptions {
  accountNumberRequired?: boolean;
  routingNumberRequired?: boolean;
  accountNameRequired?: boolean;
  bankNameRequired?: boolean;
  accountTypeRequired?: boolean;
  allowedAccountTypes?: string[];
  minAccountNumberLength?: number;
  maxAccountNumberLength?: number;
  routingNumberPattern?: RegExp;
  validateRoutingChecksum?: boolean;
}

export interface BankAccountData {
  accountNumber?: string;
  routingNumber?: string;
  accountName?: string;
  bankName?: string;
  accountType?: string;
}

export type BankAccountValidationResult = ValidationResult<BankAccountData>;

export class BankAccountValidator extends BaseValidator<BankAccountData> {
  private options: BankAccountValidatorOptions;

  constructor(options: BankAccountValidatorOptions = {}) {
    super();
    this.options = {
      accountNumberRequired: true,
      routingNumberRequired: true,
      accountNameRequired: true,
      bankNameRequired: false,
      accountTypeRequired: false,
      allowedAccountTypes: ['checking', 'savings', 'business'],
      minAccountNumberLength: 5,
      maxAccountNumberLength: 17,
      routingNumberPattern: /^[0-9]{9}$/,
      validateRoutingChecksum: true,
      ...options
    };
  }

  validate(bankAccount: BankAccountData): BankAccountValidationResult {
    if (!bankAccount) {
      return this.createError('BANK_ACCOUNT_REQUIRED', 'Bank account data is required');
    }

    // Account number validation
    if (this.options.accountNumberRequired && !bankAccount.accountNumber) {
      return this.createError('ACCOUNT_NUMBER_REQUIRED', 'Account number is required');
    }

    if (bankAccount.accountNumber) {
      const digitsOnly = bankAccount.accountNumber.replace(/\D/g, '');
      
      if (digitsOnly.length < this.options.minAccountNumberLength!) {
        return this.createError(
          'ACCOUNT_NUMBER_TOO_SHORT',
          `Account number must have at least ${this.options.minAccountNumberLength} digits`
        );
      }

      if (digitsOnly.length > this.options.maxAccountNumberLength!) {
        return this.createError(
          'ACCOUNT_NUMBER_TOO_LONG',
          `Account number must not exceed ${this.options.maxAccountNumberLength} digits`
        );
      }
    }

    // Routing number validation
    if (this.options.routingNumberRequired && !bankAccount.routingNumber) {
      return this.createError('ROUTING_NUMBER_REQUIRED', 'Routing number is required');
    }

    if (
      bankAccount.routingNumber &&
      !this.options.routingNumberPattern!.test(bankAccount.routingNumber)
    ) {
      return this.createError(
        'INVALID_ROUTING_NUMBER_FORMAT',
        'Routing number format is invalid. Must be 9 digits.'
      );
    }

    // Validate routing number checksum if enabled
    if (
      this.options.validateRoutingChecksum &&
      bankAccount.routingNumber &&
      !this.validateRoutingChecksum(bankAccount.routingNumber)
    ) {
      return this.createError(
        'INVALID_ROUTING_NUMBER_CHECKSUM',
        'Routing number checksum validation failed'
      );
    }

    // Account name validation
    if (this.options.accountNameRequired && !bankAccount.accountName) {
      return this.createError('ACCOUNT_NAME_REQUIRED', 'Account name is required');
    }

    // Bank name validation
    if (this.options.bankNameRequired && !bankAccount.bankName) {
      return this.createError('BANK_NAME_REQUIRED', 'Bank name is required');
    }

    // Account type validation
    if (this.options.accountTypeRequired && !bankAccount.accountType) {
      return this.createError('ACCOUNT_TYPE_REQUIRED', 'Account type is required');
    }

    // Validate allowed account types if specified
    if (
      bankAccount.accountType &&
      this.options.allowedAccountTypes &&
      this.options.allowedAccountTypes.length > 0 &&
      !this.options.allowedAccountTypes.includes(bankAccount.accountType.toLowerCase())
    ) {
      return this.createError(
        'ACCOUNT_TYPE_NOT_ALLOWED',
        `Account type must be one of: ${this.options.allowedAccountTypes.join(', ')}`
      );
    }

    return this.createSuccess({
      accountNumber: bankAccount.accountNumber?.trim(),
      routingNumber: bankAccount.routingNumber?.trim(),
      accountName: bankAccount.accountName?.trim(),
      bankName: bankAccount.bankName?.trim(),
      accountType: bankAccount.accountType?.toLowerCase().trim()
    });
  }

  /**
   * Validates the checksum for a US routing number using the ABA algorithm
   * Each digit is multiplied by a weight (3, 7, or 1) based on position
   * The sum of these products should be divisible by 10
   */
  private validateRoutingChecksum(routingNumber: string): boolean {
    if (!routingNumber || routingNumber.length !== 9) {
      return false;
    }

    const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(routingNumber.charAt(i)) * weights[i];
    }

    return sum % 10 === 0;
  }
}