// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { ValidationError, ConfigurationError } from '../errors/extraction-errors';
import { LoggerService } from '../logging/logger-service';
import {
  JSONSchema,
  SchemaGenerationOutput,
  SchemaMetadata,
} from '../types/schema-extractor';

interface ResourceConfig {
  resourceType?: string;
  description?: string;
  api_type?: string;
  field_mappings?: Record<string, string>;
  discriminators?: Array<{
    field: string;
    api_property: string;
    options: Record<string, any>;
  }>;
  arrays?: Array<any>;
  validation_rules?: any;
}

export class ValidationService {
  private logger: LoggerService;

  constructor() {
    this.logger = LoggerService.getInstance();
  }

  validateResourceConfig(config: ResourceConfig): void {
    const errors: string[] = [];

    if (!config.description) errors.push('Missing required field: description');
    if (!config.api_type) errors.push('Missing required field: api_type');
    if (!config.field_mappings) errors.push('Missing required field: field_mappings');

    if (config.field_mappings) {
      if (!config.field_mappings.name) {
        errors.push('Field mappings must include "name" field');
      }
    }

    if (config.discriminators) {
      for (const disc of config.discriminators) {
        if (!disc.field) errors.push('Discriminator missing field name');
        if (!disc.options || Object.keys(disc.options).length < 2) {
          errors.push(`Discriminator ${disc.field} must have at least 2 options`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ConfigurationError('Resource configuration validation failed', {
        resourceType: config.resourceType,
        errors,
      });
    }

    this.logger.debug('Resource configuration validated', {
      resourceType: config.resourceType,
    });
  }

  validateSchemaOutput(output: SchemaGenerationOutput): void {
    const errors: string[] = [];

    if (!output.schema) {
      errors.push('Missing schema in output');
    } else {
      if (output.schema.$schema !== 'http://json-schema.org/draft-07/schema#') {
        errors.push('Schema must use JSON Schema draft-07');
      }
      if (output.schema.type !== 'object') {
        errors.push('Root schema type must be "object"');
      }
      if (!output.schema.properties) {
        errors.push('Schema must have properties');
      }
    }

    if (!output.schema || !output.schema['x-f5xc-metadata']) {
      errors.push('Schema missing x-f5xc-metadata');
    } else {
      const metadata = output.schema['x-f5xc-metadata'];
      if (!metadata.extractedAt) errors.push('Metadata missing extractedAt');
      if (!metadata.extractionVersion) errors.push('Metadata missing extractionVersion');
      if (!metadata.resourceType) errors.push('Metadata missing resourceType');
    }

    if (output.coverage) {
      if (output.coverage.percentage < 80) {
        this.logger.warn('Schema coverage below 80%', {
          coverage: output.coverage.percentage,
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Schema output validation failed', { errors });
    }

    this.logger.debug('Schema output validated');
  }

  validateSchema(schema: JSONSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema.$schema) {
      errors.push('Missing $schema property');
    } else if (schema.$schema !== 'http://json-schema.org/draft-07/schema#') {
      errors.push('Invalid $schema value, expected draft-07');
    }

    if (!schema.type) {
      errors.push('Missing type property');
    } else if (schema.type !== 'object') {
      errors.push('Root type must be "object"');
    }

    if (!schema.properties) {
      errors.push('Missing properties object');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
