// Common types for the validation library

// Define country codes enum for phone validation
export enum CountryCode {
    US = "1",
    UK = "44",
    CA = "1",
    AU = "61",
    DE = "49",
    FR = "33",
    JP = "81",
    IN = "91",
    // Add more country codes as needed
  }
  
  // Contact information type
  export interface ContactInfo {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }
  
  // Error code types for the contact module
  export enum EmailErrorCode {
    EMAIL_REQUIRED = 'EMAIL_REQUIRED',
    INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
    EMAIL_TOO_LONG = 'EMAIL_TOO_LONG',
    DOMAIN_NOT_ALLOWED = 'DOMAIN_NOT_ALLOWED',
    DOMAIN_BLOCKED = 'DOMAIN_BLOCKED'
  }
  
  export enum PhoneErrorCode {
    PHONE_REQUIRED = 'PHONE_REQUIRED',
    INVALID_PHONE_FORMAT = 'INVALID_PHONE_FORMAT',
    PHONE_TOO_SHORT = 'PHONE_TOO_SHORT',
    PHONE_TOO_LONG = 'PHONE_TOO_LONG',
    COUNTRY_CODE_REQUIRED = 'COUNTRY_CODE_REQUIRED',
    COUNTRY_CODE_NOT_ALLOWED = 'COUNTRY_CODE_NOT_ALLOWED'
  }
  
  export enum AddressErrorCode {
    ADDRESS_REQUIRED = 'ADDRESS_REQUIRED',
    STREET_REQUIRED = 'STREET_REQUIRED',
    CITY_REQUIRED = 'CITY_REQUIRED',
    STATE_REQUIRED = 'STATE_REQUIRED',
    POSTAL_CODE_REQUIRED = 'POSTAL_CODE_REQUIRED',
    COUNTRY_REQUIRED = 'COUNTRY_REQUIRED',
    STREET_TOO_LONG = 'STREET_TOO_LONG',
    CITY_TOO_LONG = 'CITY_TOO_LONG',
    STATE_TOO_LONG = 'STATE_TOO_LONG',
    INVALID_POSTAL_CODE = 'INVALID_POSTAL_CODE'
  }