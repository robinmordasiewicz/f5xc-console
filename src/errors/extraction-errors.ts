// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Extraction Error Hierarchy
 * Provides structured error handling with context and recovery suggestions
 */

/**
 * Base Extraction Error class
 * Extends Error with code, context, recoverability, and suggestions
 */
export class ExtractionError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;
  public readonly recoverable: boolean;
  public readonly suggestions: string[];

  constructor(
    message: string,
    code: string,
    options: {
      context?: Record<string, any>;
      recoverable?: boolean;
      suggestions?: string[];
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = options.context;
    this.recoverable = options.recoverable ?? false;
    this.suggestions = options.suggestions ?? [];

    if (options.cause) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      recoverable: this.recoverable,
      suggestions: this.suggestions,
      stack: this.stack,
    };
  }
}

/**
 * Configuration Error
 * Thrown when configuration loading or validation fails
 */
export class ConfigurationError extends ExtractionError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', {
      context,
      recoverable: true,
      suggestions: [
        'Verify configuration file exists and is valid YAML',
        'Check resource type name matches configuration',
        'Ensure all required fields are present',
      ],
    });
  }
}

/**
 * Validation Error
 * Thrown when schema or resource validation fails
 */
export class ValidationError extends ExtractionError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', {
      context,
      recoverable: false,
      suggestions: [
        'Review validation errors and fix data issues',
        'Check schema against JSON Schema draft-07',
        'Verify all required fields are populated',
      ],
    });
  }
}

/**
 * Form Interaction Error
 * Thrown when browser form automation fails
 */
export class FormInteractionError extends ExtractionError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'FORM_INTERACTION_ERROR', {
      context,
      recoverable: true,
      suggestions: [
        'Verify form is fully loaded before interaction',
        'Increase DOM stabilization timeout',
        'Check for JavaScript errors in console',
        'Verify selectors are correct and stable',
      ],
    });
  }
}

/**
 * API Discovery Error
 * Thrown when API reference resolution fails
 */
export class APIDiscoveryError extends ExtractionError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'API_DISCOVERY_ERROR', {
      context,
      recoverable: true,
      suggestions: [
        'Verify API credentials are correct',
        'Check network connectivity to F5 XC',
        'Fallback to placeholder values enabled',
        'Check API rate limits and quotas',
      ],
    });
  }
}
