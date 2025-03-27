export interface ValidationResult<T> {
    isValid: boolean;
    value?: T;
    errors?: ValidationError[];
  }
  
  export interface ValidationError {
    code: string;
    message: string;
    field?: string;
  }