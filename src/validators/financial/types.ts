// Define card types enum for credit card validation
export enum CardType {
    VISA = 'visa',
    MASTERCARD = 'mastercard',
    AMEX = 'amex',
    DISCOVER = 'discover',
    DINERS = 'diners',
    JCB = 'jcb',
    UNKNOWN = 'unknown'
  }
  
  // Define account types enum for bank account validation
  export enum AccountType {
    CHECKING = 'checking',
    SAVINGS = 'savings',
    BUSINESS = 'business',
    MONEY_MARKET = 'money_market',
    CERTIFICATE = 'certificate',
    OTHER = 'other'
  }
  
  // Financial information type
  export interface FinancialInfo {
    bankAccount?: {
      accountNumber?: string;
      routingNumber?: string;
      accountName?: string;
      bankName?: string;
      accountType?: string;
    };
    creditCard?: {
      number?: string;
      expiry?: string;
      cvv?: string;
      name?: string;
    };
  }
  
  // Error code types for the financial module
  export enum CreditCardErrorCode {
    CREDIT_CARD_REQUIRED = 'CREDIT_CARD_REQUIRED',
    CARD_NUMBER_REQUIRED = 'CARD_NUMBER_REQUIRED',
    INVALID_CARD_NUMBER_FORMAT = 'INVALID_CARD_NUMBER_FORMAT',
    INVALID_CARD_NUMBER_CHECKSUM = 'INVALID_CARD_NUMBER_CHECKSUM',
    CARD_TYPE_NOT_ALLOWED = 'CARD_TYPE_NOT_ALLOWED',
    EXPIRY_REQUIRED = 'EXPIRY_REQUIRED',
    INVALID_EXPIRY_FORMAT = 'INVALID_EXPIRY_FORMAT',
    EXPIRED_CARD = 'EXPIRED_CARD',
    CVV_REQUIRED = 'CVV_REQUIRED',
    INVALID_CVV = 'INVALID_CVV',
    CARDHOLDER_NAME_REQUIRED = 'CARDHOLDER_NAME_REQUIRED'
  }
  
  export enum BankAccountErrorCode {
    BANK_ACCOUNT_REQUIRED = 'BANK_ACCOUNT_REQUIRED',
    ACCOUNT_NUMBER_REQUIRED = 'ACCOUNT_NUMBER_REQUIRED',
    ACCOUNT_NUMBER_TOO_SHORT = 'ACCOUNT_NUMBER_TOO_SHORT',
    ACCOUNT_NUMBER_TOO_LONG = 'ACCOUNT_NUMBER_TOO_LONG',
    ROUTING_NUMBER_REQUIRED = 'ROUTING_NUMBER_REQUIRED',
    INVALID_ROUTING_NUMBER_FORMAT = 'INVALID_ROUTING_NUMBER_FORMAT',
    INVALID_ROUTING_NUMBER_CHECKSUM = 'INVALID_ROUTING_NUMBER_CHECKSUM',
    ACCOUNT_NAME_REQUIRED = 'ACCOUNT_NAME_REQUIRED',
    BANK_NAME_REQUIRED = 'BANK_NAME_REQUIRED',
    ACCOUNT_TYPE_REQUIRED = 'ACCOUNT_TYPE_REQUIRED',
    ACCOUNT_TYPE_NOT_ALLOWED = 'ACCOUNT_TYPE_NOT_ALLOWED'
  }