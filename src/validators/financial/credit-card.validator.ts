import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export enum CardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNKNOWN = 'unknown'
}

export interface CreditCardValidatorOptions {
  numberRequired?: boolean;
  expiryRequired?: boolean;
  cvvRequired?: boolean;
  nameRequired?: boolean;
  allowedCardTypes?: CardType[];
  validateLuhn?: boolean;
}

export interface CreditCardData {
  number?: string;
  expiry?: string;
  cvv?: string;
  name?: string;
}

// Include cardType in the result interface
export interface CreditCardResult extends CreditCardData {
  cardType: CardType;
}

export type CreditCardValidationResult = ValidationResult<CreditCardResult>;

export class CreditCardValidator extends BaseValidator<CreditCardResult> {
  private options: CreditCardValidatorOptions;

  // Card pattern definitions
  private cardPatterns = {
    [CardType.VISA]: /^4[0-9]{12}(?:[0-9]{3})?$/,
    [CardType.MASTERCARD]: /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/,
    [CardType.AMEX]: /^3[47][0-9]{13}$/,
    [CardType.DISCOVER]: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    [CardType.DINERS]: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
    [CardType.JCB]: /^(?:2131|1800|35\d{3})\d{11}$/
  };

  // CVV length by card type
  private cvvLengths = {
    [CardType.AMEX]: 4,
    default: 3
  };

  // Expiry date pattern (MM/YY or MM/YYYY)
  private expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/;

  constructor(options: CreditCardValidatorOptions = {}) {
    super();
    this.options = {
      numberRequired: true,
      expiryRequired: true,
      cvvRequired: true,
      nameRequired: false,
      allowedCardTypes: Object.values(CardType).filter(type => type !== CardType.UNKNOWN),
      validateLuhn: true,
      ...options
    };
  }

  validate(card: CreditCardData): CreditCardValidationResult {
    if (!card) {
      return this.createError('CREDIT_CARD_REQUIRED', 'Credit card data is required');
    }

    // Card number validation
    if (this.options.numberRequired && !card.number) {
      return this.createError('CARD_NUMBER_REQUIRED', 'Card number is required');
    }

    // Process the card number (remove spaces and dashes)
    const processedNumber = card.number?.replace(/[\s-]/g, '');
    
    // Default to unknown card type
    let cardType = CardType.UNKNOWN;

    if (processedNumber) {
      // Determine card type
      cardType = this.detectCardType(processedNumber);

      // Check if card type is allowed
      if (
        cardType !== CardType.UNKNOWN && 
        this.options.allowedCardTypes && 
        !this.options.allowedCardTypes.includes(cardType)
      ) {
        return this.createError(
          'CARD_TYPE_NOT_ALLOWED',
          `Card type ${cardType} is not accepted`
        );
      }

      // If card type is unknown but number is provided, it's an invalid format
      if (cardType === CardType.UNKNOWN) {
        return this.createError(
          'INVALID_CARD_NUMBER_FORMAT',
          'Card number format is not recognized'
        );
      }

      // Validate Luhn algorithm if enabled
      if (this.options.validateLuhn && !this.validateLuhnChecksum(processedNumber)) {
        return this.createError(
          'INVALID_CARD_NUMBER_CHECKSUM',
          'Card number failed checksum validation'
        );
      }
    }

    // Expiry date validation
    if (this.options.expiryRequired && !card.expiry) {
      return this.createError('EXPIRY_REQUIRED', 'Expiration date is required');
    }

    if (card.expiry) {
      if (!this.expiryPattern.test(card.expiry)) {
        return this.createError(
          'INVALID_EXPIRY_FORMAT',
          'Expiration date must be in MM/YY or MM/YYYY format'
        );
      }

      if (!this.validateExpiryDate(card.expiry)) {
        return this.createError(
          'EXPIRED_CARD',
          'Credit card has expired'
        );
      }
    }

    // CVV validation
    if (this.options.cvvRequired && !card.cvv) {
      return this.createError('CVV_REQUIRED', 'CVV is required');
    }

    if (card.cvv) {
      const requiredCvvLength = cardType === CardType.AMEX 
        ? this.cvvLengths[CardType.AMEX] 
        : this.cvvLengths.default;
        
      if (!/^\d+$/.test(card.cvv) || card.cvv.length !== requiredCvvLength) {
        return this.createError(
          'INVALID_CVV',
          `CVV must be ${requiredCvvLength} digits for ${cardType} cards`
        );
      }
    }

    // Cardholder name validation
    if (this.options.nameRequired && !card.name) {
      return this.createError('CARDHOLDER_NAME_REQUIRED', 'Cardholder name is required');
    }

    // Create result object that explicitly includes cardType
    const result: CreditCardResult = {
      number: this.maskCardNumber(processedNumber || ''),
      expiry: card.expiry?.trim(),
      cvv: card.cvv?.trim(),
      name: card.name?.trim(),
      cardType: cardType
    };

    return this.createSuccess(result);
  }

  /**
   * Detects the credit card type based on its number pattern
   */
  private detectCardType(cardNumber: string): CardType {
    for (const [type, pattern] of Object.entries(this.cardPatterns)) {
      if (pattern.test(cardNumber)) {
        return type as CardType;
      }
    }
    return CardType.UNKNOWN;
  }

  /**
   * Validates a credit card number using the Luhn algorithm
   * The Luhn algorithm creates a checksum to help validate credit card numbers
   */
  private validateLuhnChecksum(cardNumber: string): boolean {
    if (!cardNumber || !/^\d+$/.test(cardNumber)) {
      return false;
    }

    let sum = 0;
    let alternate = false;

    // Process from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      // Double every second digit
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      alternate = !alternate;
    }

    return sum % 10 === 0;
  }

  /**
   * Validates that the expiry date is not in the past
   */
  private validateExpiryDate(expiry: string): boolean {
    const [month, yearStr] = expiry.split('/');
    const year = yearStr.length === 2 ? '20' + yearStr : yearStr;
    
    const expiryDate = new Date(parseInt(year), parseInt(month));
    const currentDate = new Date();
    
    // Set to the last day of the month for comparison
    expiryDate.setDate(0);
    
    // Compare with current date
    return expiryDate >= currentDate;
  }

  /**
   * Masks the credit card number for security purposes
   * Returns format like: **** **** **** 1234
   */
  private maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) {
      return cardNumber;
    }
    
    const lastFourDigits = cardNumber.slice(-4);
    const maskedPart = cardNumber.slice(0, -4).replace(/./g, '*');
    
    // Format with spaces for readability
    let formatted = '';
    const combined = maskedPart + lastFourDigits;
    
    for (let i = 0; i < combined.length; i += 4) {
      formatted += combined.substr(i, 4) + ' ';
    }
    
    return formatted.trim();
  }
}