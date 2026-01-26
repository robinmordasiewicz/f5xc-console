// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Field Mapper
 *
 * Maps UI field names to API property paths using configuration from field-mappings.yaml.
 * Bridges the gap between human-friendly UI labels and machine-readable API schemas.
 *
 * Usage:
 * ```typescript
 * const mapper = new FieldMapper();
 * await mapper.loadMappings('config/field-mappings.yaml');
 *
 * const apiPath = mapper.mapFieldToApiProperty('healthcheck', 'name');
 * // Returns: "metadata.name"
 *
 * const discriminatorPath = mapper.mapDiscriminatorField(
 *   'healthcheck',
 *   'health_check',
 *   'HTTP HealthCheck'
 * );
 * // Returns: "http_health_check"
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Field mapping configuration structure
 */
export interface FieldMappingConfig {
  version: string;
  last_updated: string;
  [resourceType: string]: ResourceMappings | any;
}

/**
 * Mappings for a single resource type
 */
export interface ResourceMappings {
  description?: string;
  api_type?: string;
  common_fields?: Record<string, string>;
  discriminator_fields?: Record<string, Record<string, string>>;
  nested_configs?: Record<string, NestedConfigMappings>;
  transformations?: Record<string, FieldTransformation>;
  validation?: ValidationRules;
}

/**
 * Nested configuration mappings
 */
export interface NestedConfigMappings {
  [fieldName: string]: string | DiscriminatorMapping;
}

/**
 * Discriminator field mapping within nested config
 */
export interface DiscriminatorMapping {
  __discriminator__?: {
    field: string;
    mappings: Record<string, string>;
  };
}

/**
 * Field transformation rules
 */
export interface FieldTransformation {
  type: 'array' | 'object' | 'string' | 'boolean' | 'number';
  item_type?: string;
  ui_format?: string;
}

/**
 * Validation rules for mappings
 */
export interface ValidationRules {
  required_api_fields?: string[];
  mutually_exclusive?: string[][];
}

/**
 * Mapping result with additional context
 */
export interface MappingResult {
  /** API property path */
  apiProperty: string;
  /** Whether this is a UI-only field */
  isUIOnly: boolean;
  /** Field transformation if applicable */
  transformation?: FieldTransformation;
  /** Source of mapping (common, discriminator, nested) */
  source: 'common' | 'discriminator' | 'nested';
}

/**
 * Field Mapper class
 */
export class FieldMapper {
  private config: FieldMappingConfig | null = null;
  private configPath: string | null = null;

  /**
   * Load field mappings from YAML file
   */
  async loadMappings(yamlPath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(yamlPath);
      const fileContent = fs.readFileSync(absolutePath, 'utf8');
      this.config = yaml.load(fileContent) as FieldMappingConfig;
      this.configPath = absolutePath;
    } catch (error) {
      throw new Error(
        `Failed to load field mappings from ${yamlPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load mappings synchronously (for cases where async is not available)
   */
  loadMappingsSync(yamlPath: string): void {
    try {
      const absolutePath = path.resolve(yamlPath);
      const fileContent = fs.readFileSync(absolutePath, 'utf8');
      this.config = yaml.load(fileContent) as FieldMappingConfig;
      this.configPath = absolutePath;
    } catch (error) {
      throw new Error(
        `Failed to load field mappings from ${yamlPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Map a UI field name to its API property path
   *
   * @param resourceType - Resource type (e.g., 'healthcheck', 'origin_pool')
   * @param uiFieldName - UI field name from Console form
   * @returns Mapping result with API property path and metadata
   */
  mapFieldToApiProperty(resourceType: string, uiFieldName: string): MappingResult | null {
    this.ensureConfigLoaded();

    const resourceMappings = this.getResourceMappings(resourceType);
    if (!resourceMappings) {
      return null;
    }

    // Normalize UI field name for matching (snake_case)
    const normalizedFieldName = this.normalizeFieldName(uiFieldName);

    // Check common fields first
    if (resourceMappings.common_fields) {
      const apiProperty = resourceMappings.common_fields[normalizedFieldName];
      if (apiProperty) {
        return {
          apiProperty,
          isUIOnly: apiProperty === '__ui_only__',
          transformation: resourceMappings.transformations?.[normalizedFieldName],
          source: 'common',
        };
      }
    }

    return null;
  }

  /**
   * Map a discriminator field option to its API property path
   *
   * @param resourceType - Resource type
   * @param discriminatorFieldName - Name of the discriminator field (e.g., 'health_check')
   * @param optionValue - Selected option value (e.g., 'HTTP HealthCheck')
   * @returns Mapping result with API property path
   */
  mapDiscriminatorField(
    resourceType: string,
    discriminatorFieldName: string,
    optionValue: string
  ): MappingResult | null {
    this.ensureConfigLoaded();

    const resourceMappings = this.getResourceMappings(resourceType);
    if (!resourceMappings?.discriminator_fields) {
      return null;
    }

    const normalizedFieldName = this.normalizeFieldName(discriminatorFieldName);
    const discriminatorMappings = resourceMappings.discriminator_fields[normalizedFieldName];

    if (!discriminatorMappings) {
      return null;
    }

    const apiProperty = discriminatorMappings[optionValue];
    if (!apiProperty) {
      return null;
    }

    return {
      apiProperty,
      isUIOnly: false,
      source: 'discriminator',
    };
  }

  /**
   * Map a nested configuration field to its API property path
   *
   * @param resourceType - Resource type
   * @param nestedConfigName - Name of the nested configuration (e.g., 'http_health_check')
   * @param fieldName - Field name within nested config
   * @returns Mapping result with API property path
   */
  mapNestedConfigField(
    resourceType: string,
    nestedConfigName: string,
    fieldName: string
  ): MappingResult | null {
    this.ensureConfigLoaded();

    const resourceMappings = this.getResourceMappings(resourceType);
    if (!resourceMappings?.nested_configs) {
      return null;
    }

    const normalizedConfigName = this.normalizeFieldName(nestedConfigName);
    const nestedConfig = resourceMappings.nested_configs[normalizedConfigName];

    if (!nestedConfig) {
      return null;
    }

    const normalizedFieldName = this.normalizeFieldName(fieldName);
    const apiProperty = nestedConfig[normalizedFieldName];

    if (typeof apiProperty !== 'string') {
      return null;
    }

    return {
      apiProperty,
      isUIOnly: false,
      source: 'nested',
    };
  }

  /**
   * Get all mappings for a resource type
   *
   * @param resourceType - Resource type
   * @returns Complete resource mappings
   */
  getResourceMappings(resourceType: string): ResourceMappings | null {
    this.ensureConfigLoaded();

    if (!this.config) {
      return null;
    }

    const mappings = this.config[resourceType];

    // Filter out non-resource entries (version, metadata, global_patterns)
    if (!mappings || typeof mappings !== 'object' || !('common_fields' in mappings || 'discriminator_fields' in mappings)) {
      return null;
    }

    return mappings as ResourceMappings;
  }

  /**
   * Get validation rules for a resource type
   *
   * @param resourceType - Resource type
   * @returns Validation rules
   */
  getValidationRules(resourceType: string): ValidationRules | null {
    const resourceMappings = this.getResourceMappings(resourceType);
    return resourceMappings?.validation ?? null;
  }

  /**
   * Validate that a set of API property paths is valid for a resource
   *
   * @param resourceType - Resource type
   * @param apiProperties - Array of API property paths to validate
   * @returns Validation result with errors if any
   */
  validateMappings(
    resourceType: string,
    apiProperties: string[]
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const rules = this.getValidationRules(resourceType);

    if (!rules) {
      return { valid: true, errors: [] };
    }

    // Check required fields
    if (rules.required_api_fields) {
      const missing = rules.required_api_fields.filter(
        required => !apiProperties.includes(required)
      );

      if (missing.length > 0) {
        errors.push(`Missing required API fields: ${missing.join(', ')}`);
      }
    }

    // Check mutually exclusive fields
    if (rules.mutually_exclusive) {
      for (const exclusiveGroup of rules.mutually_exclusive) {
        const presentFields = exclusiveGroup.filter(field =>
          apiProperties.includes(field)
        );

        if (presentFields.length > 1) {
          errors.push(
            `Mutually exclusive fields present: ${presentFields.join(', ')}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get list of UI-only fields for a resource type
   *
   * @param resourceType - Resource type
   * @returns Array of UI-only field names
   */
  getUIOnlyFields(resourceType: string): string[] {
    const resourceMappings = this.getResourceMappings(resourceType);
    if (!resourceMappings?.common_fields) {
      return [];
    }

    return Object.entries(resourceMappings.common_fields)
      .filter(([_, apiPath]) => apiPath === '__ui_only__')
      .map(([uiField, _]) => uiField);
  }

  /**
   * Normalize field name to snake_case for matching
   *
   * @param fieldName - Original field name
   * @returns Normalized field name
   */
  private normalizeFieldName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Ensure configuration is loaded
   */
  private ensureConfigLoaded(): void {
    if (!this.config) {
      throw new Error(
        'Field mappings not loaded. Call loadMappings() or loadMappingsSync() first.'
      );
    }
  }

  /**
   * Reload mappings from file (useful for hot-reloading during development)
   */
  async reloadMappings(): Promise<void> {
    if (!this.configPath) {
      throw new Error('No configuration path set. Call loadMappings() first.');
    }

    await this.loadMappings(this.configPath);
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Get loaded configuration (for debugging)
   */
  getConfig(): FieldMappingConfig | null {
    return this.config;
  }

  /**
   * Check if mappings are loaded
   */
  isLoaded(): boolean {
    return this.config !== null;
  }

  /**
   * Get all loaded mappings (Phase 2: needed for array field handling)
   *
   * @returns Complete field mapping configuration
   */
  getMappings(): FieldMappingConfig {
    this.ensureConfigLoaded();
    return this.config!;
  }
}

/**
 * Singleton instance
 */
let fieldMapperInstance: FieldMapper | null = null;

/**
 * Get singleton field mapper instance
 */
export function getFieldMapper(): FieldMapper {
  if (!fieldMapperInstance) {
    fieldMapperInstance = new FieldMapper();
  }
  return fieldMapperInstance;
}

/**
 * Reset singleton instance (for testing)
 */
export function resetFieldMapper(): void {
  fieldMapperInstance = null;
}
