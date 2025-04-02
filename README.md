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

- **Personal Information**
 - `DOBValidator` - Date of birth validation with age calculations
 - `NameValidator` - Name validation with customizable format rules
 - `EmailValidator` - Email address validation
 - `PhoneValidator` - Phone number validation with international format support

- **Authentication**
 - `PasswordValidator` - Password strength and format validation
 - `UsernameValidator` - Username format validation

- **General Purpose**
 - `StringValidator` - Text validation with length and format options
 - `NumberValidator` - Numeric validation with range checking
 - `DateValidator` - Date format and range validation

## Getting Started

```bash
npm install ajt-validator

```
```
import { PersonalValidator } from 'ajt-validator';

// Create a validator instance
const nameValidator = new PersonalValidator.NameValidator({
  minLength: 2,
  maxLength: 50,
  allowSpecialChars: true
});

// Validate input
const result = nameValidator.validate("O'Connor");
console.log(result.isValid); // true

```

## Validation Results
All validators return consistent result objects with:

- isValid - Boolean indicating validation success
- value - The validated (and possibly transformed) value
- errors - Array of detailed error objects with code and message
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

## License
MIT