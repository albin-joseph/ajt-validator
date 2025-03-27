import { ValidationResult} from "../../interfaces/result.interface";
import { IValidator } from "../../interfaces/validation.interface";

export abstract class BaseValidator<T, R = T> implements IValidator<T, R> {
    abstract validate(value: T): ValidationResult<R>;
  
    protected createError(code: string, message: string): ValidationResult<R> {
      return {
        isValid: false,
        errors: [{ code, message }]
      };
    }
  
    protected createSuccess(value: R): ValidationResult<R> {
      return {
        isValid: true,
        value
      };
    }
  }