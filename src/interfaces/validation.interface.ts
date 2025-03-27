import { ValidationResult } from "./result.interface";

export interface IValidator<T, R = T> {
    validate(value: T): ValidationResult<R>;
  }