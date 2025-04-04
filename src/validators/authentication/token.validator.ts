import { BaseValidator } from "../base";
import { ValidationResult } from "../../interfaces";

export interface TokenValidatorOptions {
  minLength?: number;
  maxLength?: number;
  allowedPrefixes?: string[];
  validateJWT?: boolean;
  validateExpiry?: boolean;
}

export interface TokenData {
  token: string;
  issuedAt?: number; // Unix timestamp
  expiresAt?: number; // Unix timestamp
}

export type TokenValidationResult = ValidationResult<TokenData>;

export class TokenValidator extends BaseValidator<TokenData> {
  private options: TokenValidatorOptions;
  private jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;

  constructor(options: TokenValidatorOptions = {}) {
    super();
    this.options = {
      minLength: 8,
      maxLength: 2048,
      allowedPrefixes: ['Bearer ', 'Token '],
      validateJWT: false,
      validateExpiry: true,
      ...options
    };
  }

  validate(tokenData: TokenData | string): TokenValidationResult {
    // Handle string input (convert to TokenData)
    if (typeof tokenData === 'string') {
      tokenData = { token: tokenData };
    }

    if (!tokenData || !tokenData.token) {
      return this.createError('TOKEN_REQUIRED', 'Authentication token is required');
    }

    const token = tokenData.token.trim();

    // Length validation
    if (token.length < this.options.minLength!) {
      return this.createError(
        'TOKEN_TOO_SHORT',
        `Token must be at least ${this.options.minLength} characters`
      );
    }

    if (token.length > this.options.maxLength!) {
      return this.createError(
        'TOKEN_TOO_LONG',
        `Token must not exceed ${this.options.maxLength} characters`
      );
    }

    // Check JWT format if required
    if (this.options.validateJWT && !this.jwtPattern.test(this.extractTokenValue(token))) {
      return this.createError(
        'INVALID_JWT_FORMAT',
        'Token is not in valid JWT format'
      );
    }

    // Check prefixes if any are specified
    if (this.options.allowedPrefixes && this.options.allowedPrefixes.length > 0) {
      const hasValidPrefix = this.options.allowedPrefixes.some(prefix => 
        token.startsWith(prefix)
      );
      
      if (!hasValidPrefix) {
        return this.createError(
          'INVALID_TOKEN_PREFIX',
          `Token must start with one of: ${this.options.allowedPrefixes.join(', ')}`
        );
      }
    }

    // Check expiration if enabled and expiry is provided
    if (this.options.validateExpiry && tokenData.expiresAt) {
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (currentTime > tokenData.expiresAt) {
        return this.createError(
          'TOKEN_EXPIRED',
          'Authentication token has expired'
        );
      }
    }

    return this.createSuccess({
      token: token,
      issuedAt: tokenData.issuedAt,
      expiresAt: tokenData.expiresAt
    });
  }

  // Helper method to extract token value when prefixed with "Bearer " or similar
  private extractTokenValue(token: string): string {
    for (const prefix of this.options.allowedPrefixes || []) {
      if (token.startsWith(prefix)) {
        return token.substring(prefix.length);
      }
    }
    return token;
  }
}