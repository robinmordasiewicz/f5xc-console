// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Schema Generator
 *
 * Converts FormMetadata and OneOfRelationships into JSON Schema (draft-07) format.
 * Generates both the schema and selector metadata for automated form filling.
 */

import { FormField, InputType } from '../types/navigation';
import { DetectedFormField } from '../handlers/form-handler';
import {
  JSONSchema,
  JSONSchemaProperty,
  JSONSchemaType,
  OneOfRelationship,
  ConditionalDependency,
  SchemaMetadata,
  SchemaGenerationInput,
  SchemaGenerationOutput,
  SelectorMetadata,
} from '../types/schema-extractor';
import { FieldMapper } from '../bridge/field-mapper';
import { ArrayFieldHandler, ArrayFieldInfo, ArrayItemTemplate } from '../handlers/array-field-handler';
import { ApiDiscoveryService, ReferenceOption } from '../bridge/api-discovery-service';
import { LoggerService } from '../logging/logger-service';

/**
 * Schema Generator class
 *
 * Usage:
 * ```typescript
 * const generator = new SchemaGenerator();
 *
 * // Optional: Load field mappings for API property auto-population
 * await generator.loadFieldMappings('config/field-mappings.yaml');
 *
 * const output = generator.generate({
 *   formFields: detectedFields,
 *   oneOfRelationships: relationships,
 *   metadata: { ... },
 *   formUrl: 'https://...'
 * });
 *
 * // Output contains schema with apiProperty fields populated
 * ```
 */
export class SchemaGenerator {
  private fieldMapper: FieldMapper | null = null;
  private arrayFieldHandler: ArrayFieldHandler = new ArrayFieldHandler();
  private apiDiscovery: ApiDiscoveryService | null = null;
  private logger: LoggerService = LoggerService.getInstance();


  /**
   * Load field mappings from YAML file
   *
   * @param yamlPath - Path to field-mappings.yaml
   */
  async loadFieldMappings(yamlPath: string): Promise<void> {
    this.fieldMapper = new FieldMapper();
    await this.fieldMapper.loadMappings(yamlPath);
  }

  /**
   * Load field mappings synchronously
   *
   * @param yamlPath - Path to field-mappings.yaml
   */
  loadFieldMappingsSync(yamlPath: string): void {
    this.fieldMapper = new FieldMapper();
    this.fieldMapper.loadMappingsSync(yamlPath);
  }

  /**
   * Set API discovery service for live enum population (Phase 3)
   *
   * @param apiDiscovery - API discovery service instance
   */
  setApiDiscovery(apiDiscovery: ApiDiscoveryService): void {
    this.apiDiscovery = apiDiscovery;
  }

  /**
   * Generate JSON Schema from form fields and relationships
   */
  async generate(input: SchemaGenerationInput): Promise<SchemaGenerationOutput> {
    const warnings: string[] = [];

    // Build base schema
    const schema: JSONSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: `F5 XC ${this.capitalizeResourceType(input.metadata.resourceType)} Configuration`,
      description: `JSON Schema for F5 Distributed Cloud ${input.metadata.resourceType} resource`,
      type: 'object',
      properties: {},
      required: [],
    };

    // Filter out trigger fields from regular field processing
    // Trigger fields are used to open nested configuration dialogs and shouldn't be properties themselves
    let fieldsToProcess = input.formFields;
    if (input.metadata.nestedConfigurations && input.metadata.nestedConfigurations.length > 0) {
      const triggerNames = input.metadata.nestedConfigurations.map(nc => nc.trigger);
      fieldsToProcess = input.formFields.filter(
        field => !triggerNames.includes(field.name)
      );
    }

    // Convert fields to properties (excluding trigger fields)
    const { properties, required, fieldWarnings } = this.fieldsToProperties(
      fieldsToProcess,
      input.metadata.resourceType
    );
    schema.properties = properties;
    schema.required = required.length > 0 ? required : undefined;
    warnings.push(...fieldWarnings);

    // Build nested configuration schemas if present
    let nestedConfigs: Array<{ trigger: string; fields: string[]; dialogTitle?: string }> = [];
    if (input.metadata.nestedConfigurations && input.metadata.nestedConfigurations.length > 0) {
      nestedConfigs = input.metadata.nestedConfigurations;
      const { nestedProperties, nestedWarnings } = this.buildNestedConfigSchemas(
        nestedConfigs,
        input.formFields,
        input.metadata.resourceType
      );
      warnings.push(...nestedWarnings);

      // Merge nested properties into main schema
      schema.properties = { ...schema.properties, ...nestedProperties };
    }

    // Apply oneOf relationships
    if (input.oneOfRelationships && input.oneOfRelationships.length > 0) {
      // Integrate nested configs into oneOf options if applicable
      if (nestedConfigs.length > 0) {
        for (const relationship of input.oneOfRelationships) {
          this.integrateNestedConfigsIntoOneOf(
            relationship,
            nestedConfigs,
            input.formFields,
            input.metadata.resourceType
          );
        }
      }

      const { oneOfBlocks, oneOfWarnings } = this.buildOneOfBlocks(
        input.oneOfRelationships,
        input.formFields,
        input.metadata.resourceType
      );
      warnings.push(...oneOfWarnings);

      if (oneOfBlocks.length > 0) {
        // Merge oneOf into schema
        // For top-level oneOf, we need to restructure the schema
        schema.oneOf = oneOfBlocks;
      }
    }

    // Apply conditional dependencies
    if (input.conditionalDependencies && input.conditionalDependencies.length > 0) {
      const { conditions, conditionWarnings } = this.buildConditionalDependencies(
        input.conditionalDependencies
      );
      warnings.push(...conditionWarnings);

      if (conditions.length > 0) {
        schema.allOf = conditions;
      }
    }

    // Detect and apply enums for API reference fields (Phase 1 MVP, Phase 3 API discovery)
    const apiRefs = this.detectAPIReferenceFields(input.formFields, input.metadata.resourceType);
    let apiDiscoveryStatus: import('../types/schema-extractor').ApiDiscoveryStatus | undefined;
    if (apiRefs.length > 0) {
      const namespace = input.metadata.namespace ?? 'default';
      apiDiscoveryStatus = await this.applyApiEnums(schema, apiRefs, namespace, warnings);
    }

    // Handle array fields (Phase 2)
    if (this.fieldMapper && this.fieldMapper.isLoaded()) {
      const mappings = this.fieldMapper.getMappings();
      const resourceMappings = mappings[input.metadata.resourceType];
      if (resourceMappings && resourceMappings.array_fields) {
        this.handleArrayFields(schema, resourceMappings.array_fields, input.oneOfRelationships);
        warnings.push(
          `${Object.keys(resourceMappings.array_fields).length} array field(s) modeled with item schemas (Phase 2).`
        );
      }
    }

    // Add F5 XC metadata with API discovery status
    const enhancedMetadata: SchemaMetadata = {
      ...input.metadata,
      extractedAt: new Date().toISOString(),
      extractionVersion: '1.0.0',
      apiDiscovery: apiDiscoveryStatus,
    };
    schema['x-f5xc-metadata'] = enhancedMetadata;

    // Generate selector metadata
    const selectorMetadata = this.extractSelectorMetadata(input, schema);

    // Calculate coverage
    const coverage = this.calculateCoverage(input.formFields, schema);

    return {
      schema,
      selectorMetadata,
      warnings,
      coverage,
    };
  }

  /**
   * Convert form fields to JSON Schema properties
   */
  private fieldsToProperties(fields: DetectedFormField[], resourceType: string): {
    properties: Record<string, JSONSchemaProperty>;
    required: string[];
    fieldWarnings: string[];
  } {
    const properties: Record<string, JSONSchemaProperty> = {};
    const required: string[] = [];
    const fieldWarnings: string[] = [];

    for (const field of fields) {
      try {
        const propertyName = this.fieldNameToPropertyName(field.name);
        properties[propertyName] = this.fieldToSchemaProperty(field, resourceType);

        if (field.required) {
          required.push(propertyName);
        }
      } catch (error) {
        fieldWarnings.push(
          `Failed to convert field "${field.name}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { properties, required, fieldWarnings };
  }

  /**
   * Convert a single form field to JSON Schema property
   */
  private fieldToSchemaProperty(field: DetectedFormField, resourceType: string): JSONSchemaProperty {
    const property: JSONSchemaProperty = {
      description: this.generateFieldDescription(field),
      'x-f5xc-field': {
        inputType: field.type,
        selector: field.uid,
        advanced: false, // Will be marked by metadata
        uiLabel: field.name,
      },
    };

    // Auto-populate apiProperty if field mapper is available
    if (this.fieldMapper && this.fieldMapper.isLoaded()) {
      const mappingResult = this.fieldMapper.mapFieldToApiProperty(resourceType, field.name);
      if (mappingResult && !mappingResult.isUIOnly) {
        property['x-f5xc-field']!.apiProperty = mappingResult.apiProperty;
      }
    }

    // Map input type to JSON Schema type
    const schemaType = this.inputTypeToSchemaType(field.type);
    if (schemaType) {
      property.type = schemaType;
    }

    // Handle options (enum)
    if (field.options && field.options.length > 0) {
      property.enum = field.options;
    }

    // Handle default value - prefer explicit defaultValue over current_value
    const defaultVal = field.defaultValue ?? field.current_value;
    if (defaultVal !== undefined && defaultVal !== '') {
      property.default = this.parseDefaultValue(defaultVal, schemaType);
    }

    // Handle placeholder
    if (field.placeholder) {
      property.description = property.description
        ? `${property.description} (Placeholder: ${field.placeholder})`
        : `Placeholder: ${field.placeholder}`;
    }

    // Add validation constraints from field
    if (field.pattern) {
      property.pattern = field.pattern;
    }

    if (field.minimum !== undefined) {
      property.minimum = field.minimum;
    }

    if (field.maximum !== undefined) {
      property.maximum = field.maximum;
    }

    if (field.minLength !== undefined) {
      property.minLength = field.minLength;
    } else if (schemaType === 'string' && !field.options) {
      // Add common constraint for non-empty strings if no explicit minLength
      property.minLength = 1;
    }

    if (field.maxLength !== undefined) {
      property.maxLength = field.maxLength;
    }

    // Add x-f5xc-validation extension if any validation constraints exist
    if (field.pattern || field.minimum !== undefined || field.maximum !== undefined ||
        field.minLength !== undefined || field.maxLength !== undefined) {
      property['x-f5xc-validation'] = {
        pattern: field.pattern,
        minimum: field.minimum,
        maximum: field.maximum,
        minLength: field.minLength,
        maxLength: field.maxLength,
      };
    }

    // Add x-f5xc-ui extension for UI behavior metadata
    const uiMetadata: any = {};
    if (defaultVal) uiMetadata.defaultValue = defaultVal;
    if (field.placeholder) uiMetadata.placeholder = field.placeholder;
    if (field.helpText) uiMetadata.helpText = field.helpText;

    if (Object.keys(uiMetadata).length > 0) {
      property['x-f5xc-ui'] = uiMetadata;
    }

    return property;
  }

  /**
   * Build oneOf blocks from relationships
   */
  private buildOneOfBlocks(
    relationships: OneOfRelationship[],
    allFields: DetectedFormField[],
    resourceType: string
  ): {
    oneOfBlocks: JSONSchema[];
    oneOfWarnings: string[];
  } {
    const oneOfBlocks: JSONSchema[] = [];
    const oneOfWarnings: string[] = [];

    for (const relationship of relationships) {
      try {
        // For each option, create a schema variant
        for (const option of relationship.options) {
          const optionSchema: JSONSchema = {
            type: 'object',
            properties: {},
            required: [],
          };

          // Add discriminator constraint
          const discriminatorProperty = this.fieldNameToPropertyName(
            relationship.discriminatorField
          );
          optionSchema.properties![discriminatorProperty] = {
            const: option.optionValue,
            description: `When ${relationship.discriminatorField} is ${option.optionValue}`,
          };

          // Add exclusive fields for this option
          for (const fieldName of option.exclusiveFields) {
            const field = allFields.find(f => f.name === fieldName);
            if (field) {
              const propertyName = this.fieldNameToPropertyName(fieldName);
              optionSchema.properties![propertyName] = this.fieldToSchemaProperty(field, resourceType);

              // Mark as required if specified
              if (option.requiredFields?.includes(fieldName)) {
                optionSchema.required!.push(propertyName);
              }
            }
          }

          // Add nested oneOf if present
          if (option.nestedOneOf && option.nestedOneOf.length > 0) {
            const { oneOfBlocks: nestedBlocks } = this.buildOneOfBlocks(
              option.nestedOneOf,
              allFields,
              resourceType
            );
            if (nestedBlocks.length > 0) {
              optionSchema.oneOf = nestedBlocks;
            }
          }

          oneOfBlocks.push(optionSchema);
        }
      } catch (error) {
        oneOfWarnings.push(
          `Failed to build oneOf for "${relationship.discriminatorField}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { oneOfBlocks, oneOfWarnings };
  }

  /**
   * Build conditional dependencies (if/then/else)
   */
  private buildConditionalDependencies(
    dependencies: ConditionalDependency[]
  ): {
    conditions: JSONSchema[];
    conditionWarnings: string[];
  } {
    const conditions: JSONSchema[] = [];
    const conditionWarnings: string[] = [];

    for (const dep of dependencies) {
      try {
        const controlPropertyName = this.fieldNameToPropertyName(dep.controlField);
        const dependentPropertyNames = dep.dependentFields.map(name =>
          this.fieldNameToPropertyName(name)
        );

        // Build if/then condition
        const enabledValues = Array.isArray(dep.enabledWhen)
          ? dep.enabledWhen
          : [dep.enabledWhen];

        for (const value of enabledValues) {
          const condition: JSONSchema = {
            if: {
              properties: {
                [controlPropertyName]: { const: value },
              },
            },
            then: {
              required: dep.requiredWhenVisible ? dependentPropertyNames : undefined,
            },
          };

          conditions.push(condition);
        }
      } catch (error) {
        conditionWarnings.push(
          `Failed to build condition for "${dep.controlField}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { conditions, conditionWarnings };
  }

  /**
   * Extract selector metadata for form automation
   */
  extractSelectorMetadata(input: SchemaGenerationInput, schema: JSONSchema): SelectorMetadata {
    const fieldSelectors: SelectorMetadata['fieldSelectors'] = {};

    for (const field of input.formFields) {
      const propertyName = this.fieldNameToPropertyName(field.name);
      const schemaPath = `properties.${propertyName}`;

      fieldSelectors[field.name] = {
        schemaPath,
        selector: field.uid,
        inputType: field.type,
        required: field.required,
      };
    }

    return {
      resourceType: input.metadata.resourceType,
      fieldSelectors,
      actionSelectors: {
        submit: 'button[type="submit"]',
        cancel: 'button[aria-label*="cancel" i]',
      },
    };
  }

  /**
   * Calculate coverage statistics
   */
  private calculateCoverage(
    fields: DetectedFormField[],
    schema: JSONSchema
  ): SchemaGenerationOutput['coverage'] {
    const totalFields = fields.length;
    const schemaFields = schema.properties ? Object.keys(schema.properties).length : 0;
    const fieldsWithSelectors = fields.filter(f => f.uid).length;

    return {
      totalFields,
      schemaFields,
      fieldsWithSelectors,
      percentage: totalFields > 0 ? (schemaFields / totalFields) * 100 : 0,
    };
  }

  /**
   * Map input type to JSON Schema type
   */
  private inputTypeToSchemaType(inputType: InputType): JSONSchemaType | undefined {
    const typeMap: Record<InputType, JSONSchemaType> = {
      textbox: 'string',
      select: 'string',
      checkbox: 'boolean',
      radio: 'string',
      listbox: 'string',
      spinbutton: 'number',
      combobox: 'string',
      switch: 'boolean',
    };

    return typeMap[inputType];
  }

  /**
   * Generate field description from field metadata
   */
  private generateFieldDescription(field: DetectedFormField): string {
    const parts: string[] = [];

    if (field.type) {
      parts.push(`Input type: ${field.type}`);
    }

    if (field.required) {
      parts.push('Required field');
    }

    if (field.options && field.options.length > 0) {
      parts.push(`Options: ${field.options.slice(0, 3).join(', ')}${field.options.length > 3 ? '...' : ''}`);
    }

    return parts.join('. ');
  }

  /**
   * Convert field name to valid property name (snake_case)
   */
  private fieldNameToPropertyName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Capitalize resource type for title
   */
  private capitalizeResourceType(resourceType: string): string {
    return resourceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Parse default value based on schema type
   */
  private parseDefaultValue(value: string, type: JSONSchemaType | undefined): any {
    if (type === 'boolean') {
      return value === 'true' || value === '1';
    }
    if (type === 'number' || type === 'integer') {
      const parsed = Number(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return value;
  }

  /**
   * Build nested configuration schemas
   *
   * For fields that have nested dialogs (like "Edit HTTP Configuration"),
   * this creates nested property structures with the dialog fields.
   *
   * @param nestedConfigs - Array of nested configuration metadata
   * @param allFields - All detected form fields
   * @param resourceType - Resource type for field mapping
   * @returns Nested property schemas and warnings
   */
  private buildNestedConfigSchemas(
    nestedConfigs: Array<{ trigger: string; fields: string[]; dialogTitle?: string }>,
    allFields: DetectedFormField[],
    resourceType: string
  ): {
    nestedProperties: Record<string, JSONSchemaProperty>;
    nestedWarnings: string[];
  } {
    const nestedProperties: Record<string, JSONSchemaProperty> = {};
    const nestedWarnings: string[] = [];

    for (const config of nestedConfigs) {
      try {
        // Find the trigger field
        const triggerField = allFields.find(f => f.name === config.trigger);
        if (!triggerField) {
          nestedWarnings.push(`Nested config trigger not found: ${config.trigger}`);
          continue;
        }

        // Build properties for nested fields
        const configProperties: Record<string, JSONSchemaProperty> = {};
        const configRequired: string[] = [];

        for (const fieldName of config.fields) {
          const field = allFields.find(f => f.name === fieldName);
          if (field) {
            const propertyName = this.fieldNameToPropertyName(fieldName);
            configProperties[propertyName] = this.fieldToSchemaProperty(field, resourceType);

            if (field.required) {
              configRequired.push(propertyName);
            }
          }
        }

        // Create nested configuration property
        const nestedPropertyName = this.fieldNameToPropertyName(
          `${config.trigger}_config`
        );

        nestedProperties[nestedPropertyName] = {
          type: 'object',
          description: config.dialogTitle ?? `Configuration for ${config.trigger}`,
          properties: configProperties,
          required: configRequired.length > 0 ? configRequired : undefined,
          'x-f5xc-field': {
            inputType: 'textbox', // Placeholder - nested configs don't have a single input type
            selector: `${triggerField.uid}_config`,
            advanced: false,
            nestedConfig: config.trigger,
          },
        };
      } catch (error) {
        nestedWarnings.push(
          `Failed to build nested config for "${config.trigger}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { nestedProperties, nestedWarnings };
  }

  /**
   * Integrate nested configurations into oneOf options
   *
   * When a oneOf option has nested configurations (like HTTP having "Edit HTTP Configuration"),
   * this adds those nested properties to the corresponding oneOf block.
   *
   * @param relationship - OneOf relationship to enhance
   * @param nestedConfigs - Nested configurations to integrate
   * @param allFields - All form fields
   * @param resourceType - Resource type for field mapping
   */
  private integrateNestedConfigsIntoOneOf(
    relationship: OneOfRelationship,
    nestedConfigs: Array<{ trigger: string; fields: string[]; dialogTitle?: string }>,
    allFields: DetectedFormField[],
    resourceType: string
  ): void {
    for (const option of relationship.options) {
      // Find nested configs that belong to this option's exclusive fields
      const relevantNestedConfigs = nestedConfigs.filter(nc =>
        option.exclusiveFields.some(ef => ef.toLowerCase().includes(nc.trigger.toLowerCase()))
      );

      if (relevantNestedConfigs.length > 0) {
        // Build nested config properties
        const { nestedProperties } = this.buildNestedConfigSchemas(
          relevantNestedConfigs,
          allFields,
          resourceType
        );

        // Add to exclusive fields
        option.exclusiveFields.push(...Object.keys(nestedProperties));
      }
    }
  }

  /**
   * Generate placeholder enum for fields requiring API lookup (Phase 1 MVP)
   * Phase 3 will replace with actual API integration
   *
   * @param fieldName - Name of the field requiring placeholder enum
   * @param resourceType - Type of referenced resource (e.g., "healthcheck")
   * @returns Array of placeholder values
   */
  private generatePlaceholderEnum(
    fieldName: string,
    resourceType: string
  ): string[] {
    const placeholders: Record<string, string[]> = {
      healthcheck: ['healthcheck-1', 'healthcheck-2', 'example-healthcheck'],
      origin_pool: ['pool-1', 'pool-2', 'example-pool'],
      certificate: ['cert-1', 'cert-2', 'example-cert'],
      service_policy: ['policy-1', 'policy-2', 'example-policy'],
    };

    return placeholders[resourceType] || [`${resourceType}-placeholder-1`, `${resourceType}-placeholder-2`];
  }

  /**
   * Detect fields that reference other API resources (Phase 1 MVP)
   * These fields will use placeholder enums until Phase 3 API integration
   *
   * @param fields - All detected form fields
   * @param resourceType - Current resource type being extracted
   * @returns Array of API reference field information
   */
  private detectAPIReferenceFields(
    fields: DetectedFormField[],
    resourceType: string
  ): Array<{
    fieldName: string;
    resourceType: string;
    placeholderValues: string[];
  }> {
    const apiRefs: Array<{
      fieldName: string;
      resourceType: string;
      placeholderValues: string[];
    }> = [];

    // Detection patterns for API reference fields
    const referencePatterns: Record<string, RegExp> = {
      healthcheck: /health.*check|hc.*ref/i,
      origin_pool: /origin.*pool|pool.*ref/i,
      certificate: /cert|tls.*cert|ssl.*cert/i,
      service_policy: /service.*policy|policy.*ref/i,
    };

    for (const field of fields) {
      // Only check combobox fields (dropdowns)
      if (field.type !== 'combobox') continue;

      // Check if field name matches any reference pattern
      for (const [refType, pattern] of Object.entries(referencePatterns)) {
        if (pattern.test(field.name)) {
          const placeholders = this.generatePlaceholderEnum(field.name, refType);
          apiRefs.push({
            fieldName: field.name,
            resourceType: refType,
            placeholderValues: placeholders,
          });
          break; // Only match once per field
        }
      }
    }

    return apiRefs;
  }

  /**
   * Apply API or placeholder enums to schema properties (Phase 1 MVP, Phase 3 API discovery)
   *
   * @param schema - Schema being generated
   * @param apiRefs - Detected API reference fields
   * @param namespace - F5 XC namespace for API lookups
   * @param warnings - Array to append warnings to
   * @returns API discovery status for metadata tracking
   */
  private async applyApiEnums(
    schema: JSONSchema,
    apiRefs: Array<{
      fieldName: string;
      resourceType: string;
      placeholderValues: string[];
    }>,
    namespace: string,
    warnings: string[]
  ): Promise<import('../types/schema-extractor').ApiDiscoveryStatus> {
    // Initialize API discovery status tracking
    const apiDiscoveryStatus: import('../types/schema-extractor').ApiDiscoveryStatus = {
      enabled: this.apiDiscovery?.isEnabled() ?? false,
      references: [],
    };

    if (!schema.properties) return apiDiscoveryStatus;

    let apiSuccess = 0;
    let placeholderFallback = 0;

    for (const ref of apiRefs) {
      const propertyName = this.fieldNameToPropertyName(ref.fieldName);
      const property = schema.properties[propertyName];

      if (!property) continue;

      let enumValues: string[] = ref.placeholderValues;
      let usesPlaceholder = true;
      let lastFetched: string | undefined;
      let resolved = false;
      let fallbackUsed = false;

      // Phase 3: Try API discovery if available
      if (this.apiDiscovery && this.apiDiscovery.isEnabled()) {
        try {
          const options = await this.apiDiscovery.fetchReferenceOptions(ref.resourceType, namespace);
          if (options.length > 0 && !options[0].metadata?.isPlaceholder) {
            enumValues = options.map(opt => opt.value);
            usesPlaceholder = false;
            lastFetched = new Date().toISOString();
            resolved = true;
            apiSuccess++;
          } else {
            placeholderFallback++;
            fallbackUsed = true;
          }
        } catch (error) {
          this.logger.warn(`API discovery failed for ${ref.resourceType}, using placeholders: ${error instanceof Error ? error.message : String(error)}`);
          placeholderFallback++;
          fallbackUsed = true;
        }
      } else {
        placeholderFallback++;
        fallbackUsed = true;
      }

      // Track reference resolution status
      apiDiscoveryStatus.references.push({
        field: ref.fieldName,
        resourceType: ref.resourceType,
        resolved,
        lastFetched,
        fallbackUsed,
      });

      // Set enum values (from API or placeholders)
      property.enum = enumValues;

      // Mark as API reference
      if (!property['x-f5xc-api']) {
        property['x-f5xc-api'] = {};
      }

      property['x-f5xc-api']!.isAPIReference = true;
      property['x-f5xc-api']!.referencedResourceType = ref.resourceType;
      property['x-f5xc-api']!.usesPlaceholder = usesPlaceholder;
      if (lastFetched) {
        property['x-f5xc-api']!.lastFetched = lastFetched;
      }

      // Add note to description
      const note = usesPlaceholder
        ? `Uses placeholder values. Enable API discovery for live data.`
        : `Populated from F5 XC API at ${lastFetched}.`;
      property.description = property.description
        ? `${property.description}. ${note}`
        : note;
    }

    // Add summary warning
    if (apiSuccess > 0) {
      warnings.push(`${apiSuccess} API reference field(s) populated from live F5 XC API.`);
    }
    if (placeholderFallback > 0) {
      warnings.push(`${placeholderFallback} API reference field(s) using placeholder enums.`);
    }

    return apiDiscoveryStatus;
  }

  /**
   * Handle array fields by converting them to proper array schemas (Phase 2)
   *
   * @param schema - Schema being generated
   * @param arrayFieldsConfig - Array field configuration from field mappings
   * @param oneOfRelationships - OneOf relationships for array item discriminators
   */
  private handleArrayFields(
    schema: JSONSchema,
    arrayFieldsConfig: any,
    oneOfRelationships: OneOfRelationship[]
  ): void {
    if (!schema.properties || !arrayFieldsConfig) return;

    for (const [arrayName, config] of Object.entries<any>(arrayFieldsConfig)) {
      const propertyName = this.fieldNameToPropertyName(arrayName);

      // Phase 2: Create array property even if it doesn't exist yet
      // Array fields are conceptually different from their item fields

      // Build array item schema with oneOf for discriminated types
      const arraySchema: any = {
        type: 'array',
        description: `Array of ${arrayName}`,
        minItems: config.min_items ?? 1,
      };

      if (config.max_items) {
        arraySchema.maxItems = config.max_items;
      }

      // Build oneOf for item types if discriminator exists
      if (config.item_discriminator && config.item_types) {
        const itemOneOfSchemas: any[] = [];

        for (const [typeName, typeConfig] of Object.entries<any>(config.item_types)) {
          const itemSchema: any = {
            type: 'object',
            properties: {},
            required: typeConfig.required || [],
          };

          // Add discriminator constraint
          const discriminatorProp = this.fieldNameToPropertyName(config.item_discriminator);
          itemSchema.properties[discriminatorProp] = {
            const: typeName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description: `When ${config.item_discriminator} is ${typeName}`,
          };

          // Add type-specific fields
          if (typeConfig.fields) {
            for (const [fieldName, apiPath] of Object.entries<string>(typeConfig.fields)) {
              const fieldProp = this.fieldNameToPropertyName(fieldName);
              itemSchema.properties[fieldProp] = {
                type: fieldName.includes('port') || fieldName.includes('timeout') ? 'number' : 'string',
                description: fieldName,
                'x-f5xc-field': {
                  inputType: 'textbox',
                  apiProperty: apiPath,
                },
              };
            }
          }

          itemOneOfSchemas.push(itemSchema);
        }

        arraySchema.items = {
          oneOf: itemOneOfSchemas,
        };
      } else {
        // Simple array without discriminator
        arraySchema.items = {
          type: 'object',
          properties: {},
        };
      }

      // Add array metadata
      arraySchema['x-f5xc-array'] = {
        addButtonLabel: config.add_button_text,
        itemDiscriminator: config.item_discriminator,
      };

      // Replace property with array schema
      schema.properties[propertyName] = arraySchema;
    }
  }

  /**
   * Validate generated schema against JSON Schema spec
   *
   * This is a basic validation - for production use, would use a JSON Schema validator library
   */
  validateSchema(schema: JSONSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema.$schema) {
      errors.push('Missing $schema property');
    }

    if (!schema.type) {
      errors.push('Missing type property');
    }

    if (schema.type === 'object' && !schema.properties) {
      errors.push('Object type requires properties');
    }

    // Validate oneOf structure
    if (schema.oneOf) {
      if (!Array.isArray(schema.oneOf)) {
        errors.push('oneOf must be an array');
      } else if (schema.oneOf.length < 2) {
        errors.push('oneOf must have at least 2 alternatives');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
