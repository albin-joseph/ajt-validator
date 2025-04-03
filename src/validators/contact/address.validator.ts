import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface AddressValidatorOptions {
  streetRequired?: boolean;
  cityRequired?: boolean;
  stateRequired?: boolean;
  postalCodeRequired?: boolean;
  countryRequired?: boolean;
  maxStreetLength?: number;
  maxCityLength?: number;
  maxStateLength?: number;
  postalCodePattern?: RegExp;
}

export interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export type AddressValidationResult = ValidationResult<AddressData>;

export class AddressValidator extends BaseValidator<AddressData> {
  private options: AddressValidatorOptions;

  constructor(options: AddressValidatorOptions = {}) {
    super();
    this.options = {
      streetRequired: true,
      cityRequired: true,
      stateRequired: true,
      postalCodeRequired: true,
      countryRequired: true,
      maxStreetLength: 100,
      maxCityLength: 50,
      maxStateLength: 50,
      postalCodePattern: /^[a-zA-Z0-9\s-]{3,10}$/,
      ...options
    };
  }

  validate(address: AddressData): AddressValidationResult {
    if (!address) {
      return this.createError('ADDRESS_REQUIRED', 'Address data is required');
    }

    // Street validation
    if (this.options.streetRequired && !address.street) {
      return this.createError('STREET_REQUIRED', 'Street address is required');
    }

    if (address.street && address.street.length > this.options.maxStreetLength!) {
      return this.createError(
        'STREET_TOO_LONG',
        `Street address must not exceed ${this.options.maxStreetLength} characters`
      );
    }

    // City validation
    if (this.options.cityRequired && !address.city) {
      return this.createError('CITY_REQUIRED', 'City is required');
    }

    if (address.city && address.city.length > this.options.maxCityLength!) {
      return this.createError(
        'CITY_TOO_LONG',
        `City must not exceed ${this.options.maxCityLength} characters`
      );
    }

    // State validation
    if (this.options.stateRequired && !address.state) {
      return this.createError('STATE_REQUIRED', 'State/Province is required');
    }

    if (address.state && address.state.length > this.options.maxStateLength!) {
      return this.createError(
        'STATE_TOO_LONG',
        `State/Province must not exceed ${this.options.maxStateLength} characters`
      );
    }

    // Postal code validation
    if (this.options.postalCodeRequired && !address.postalCode) {
      return this.createError('POSTAL_CODE_REQUIRED', 'Postal code is required');
    }

    if (
      address.postalCode &&
      !this.options.postalCodePattern!.test(address.postalCode)
    ) {
      return this.createError(
        'INVALID_POSTAL_CODE',
        'Postal code format is invalid'
      );
    }

    // Country validation
    if (this.options.countryRequired && !address.country) {
      return this.createError('COUNTRY_REQUIRED', 'Country is required');
    }

    return this.createSuccess({
      street: address.street?.trim(),
      city: address.city?.trim(),
      state: address.state?.trim(),
      postalCode: address.postalCode?.trim(),
      country: address.country?.trim()
    });
  }
}