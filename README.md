# ajt-validator

A comprehensive, flexible validation library for JavaScript and TypeScript applications that provides robust data validation with minimal configuration.

## Features

- **Type-safe validation** - Built with TypeScript for strong typing
- **Modular architecture** - Use only the validators you need
- **Extensible framework** - Create custom validators by extending base classes
- **Rich validation results** - Detailed error information and metadata
- **Zero dependencies** - Lightweight and efficient
- **Framework agnostic** - Works with any JS/TS project

## Core Validators

### Personal Information
- `NameValidator` - Name validation with customizable format rules
- `DOBValidator` - Date of birth validation with age calculations
- `AgeValidator` - Age validation with minimum and maximum restrictions
- `GenderValidator` - Gender validation with customizable options
- `PassportValidator` - Passport number validation with authority checking

### Contact Information
- `EmailValidator` - Email address validation with domain restrictions
- `PhoneValidator` - Phone number validation with international format support
- `AddressValidator` - Address validation with customizable field requirements

### Authentication
- `PasswordValidator` - Password strength and format validation
- `UsernameValidator` - Username format validation

### General Purpose
- `StringValidator` - Text validation with length and format options
- `NumberValidator` - Numeric validation with range checking
- `DateValidator` - Date format and range validation

## Installation

```bash
npm install ajt-validator

```

## Usage

```
import { PersonalValidator, ContactValidator } from 'ajt-validator';

// Validate name
const nameValidator = new PersonalValidator.NameValidator({
  minLength: 2,
  maxLength: 50,
  allowSpecialChars: true
});

const nameResult = nameValidator.validate("O'Connor");
console.log(nameResult.success); // true

// Validate email
const emailValidator = new ContactValidator.EmailValidator({
  strictMode: true,
  blockedDomains: ['temporarymail.com']
});

const emailResult = emailValidator.validate('user@example.com');
console.log(emailResult.success); // true

// Validate address
const addressValidator = new ContactValidator.AddressValidator();
const addressResult = addressValidator.validate({
  street: '123 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'USA'
});
console.log(addressResult.success); // true

```

## Validation Results
All validators return consistent result objects with:

- isValid - Boolean indicating validation success
- value - The validated (and possibly transformed) value
- errors - Array of detailed error objects with code and message
- errorMessage - Human-readable error message if validation failed
- Additional metadata specific to each validator type

## Extending the Library
Create custom validators by extending the base classes:

```
import { BaseValidator } from 'ajt-validator';

class CustomValidator extends BaseValidator {
  validate(value) {
    // Custom validation logic
  }
}

```

## Extensible Architecture
Each validator can be configured with options for your specific use case:

```
// Customize phone validation
const phoneValidator = new ContactValidator.PhoneValidator({
  requireCountryCode: true,
  allowedCountryCodes: ['1', '44', '61'], // US, UK, Australia
  minLength: 10,
  maxLength: 15,
  allowExtension: true
});

// Customize address validation
const addressValidator = new ContactValidator.AddressValidator({
  streetRequired: true,
  cityRequired: true,
  stateRequired: false, // Make state optional
  postalCodePattern: /^[0-9]{5}$/, // US 5-digit postal code
  maxStreetLength: 100
});
```

## Creating Custom Validators
Create custom validators by extending the base classes:

```
import { BaseValidator } from 'ajt-validator';
import { ValidationResult } from 'ajt-validator/interfaces';

class CustomValidator extends BaseValidator<string> {
  validate(value: string): ValidationResult<string> {
    // Custom validation logic
    if (!value) {
      return this.createError('VALUE_REQUIRED', 'Value is required');
    }
    
    // Additional validation...
    
    return this.createSuccess(value);
  }
}
```

## License
MIT
