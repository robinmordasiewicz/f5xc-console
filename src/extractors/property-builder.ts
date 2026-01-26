// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Property Builder - Shared Schema Building Utilities
 *
 * Provides reusable functions for building JSON Schema properties,
 * nested configurations, discriminated unions, and array fields.
 * Used by both healthcheck and origin_pool extraction scripts.
 */

import {
  ResourceDefinition,
  FieldDefinition,
  NestedConfigDefinition,
  ArrayFieldDefinition,
  SchemaOutput,
  SelectorOutput,
} from './resource-definition';

/**
 * Options for PropertyBuilder schema generation
 */
export interface PropertyBuilderOptions {
  /** Use deterministic output (no timestamps) for idempotent generation */
  deterministic?: boolean;
  /** Override extraction timestamp (ISO 8601 format) */
  extractedAt?: string;
}

/**
 * PropertyBuilder class for generating JSON Schema from resource definitions
 */
export class PropertyBuilder {
  /**
   * Build a complete schema from a resource definition
   * @param definition - The resource definition to build from
   * @param options - Optional settings for deterministic output
   */
  buildFromDefinition(definition: ResourceDefinition, options?: PropertyBuilderOptions): SchemaOutput {
    const schema: any = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: definition.title,
      description: definition.description || `JSON Schema for F5 Distributed Cloud ${definition.resourceType} resource`,
      type: 'object',
      properties: {},
      required: [],
    };

    const selectors: SelectorOutput = {
      resourceType: definition.resourceType,
      fieldSelectors: {},
      nestedSelectors: {},
      actionSelectors: {
        submit: `button:has(generic:text("Add ${this.capitalizeFirst(definition.resourceType)}"))`,
        cancel: 'button:has(generic:text("Cancel"))',
      },
    };

    // Build top-level fields
    for (const field of definition.fields) {
      const property = this.buildProperty(field, definition.tooltipData);
      schema.properties[field.name] = property;

      if (field.required) {
        schema.required.push(field.name);
      }

      // Build selector metadata
      selectors.fieldSelectors[field.label] = {
        schemaPath: `properties.${field.name}`,
        inputType: this.getInputType(field.type),
        required: field.required,
        advanced: field.advanced || false,
      };
    }

    // Build nested configurations
    const nestedConfigNames: string[] = [];
    if (definition.nestedConfigs) {
      for (const nestedConfig of definition.nestedConfigs) {
        const nestedSchema = this.buildNestedConfig(nestedConfig, definition.tooltipData);
        schema.properties[nestedConfig.name] = nestedSchema;
        nestedConfigNames.push(nestedConfig.name);

        // Initialize nested selector object
        selectors.nestedSelectors![nestedConfig.name] = {};

        // Build selectors for nested fields
        for (const field of nestedConfig.fields) {
          selectors.nestedSelectors![nestedConfig.name][field.label] = {
            schemaPath: `properties.${nestedConfig.name}.properties.${field.name}`,
            inputType: this.getInputType(field.type),
            required: field.required,
            advanced: field.advanced || false,
          };
        }

        // Add action selectors for nested config
        if (nestedConfig.actionSelectors) {
          if (nestedConfig.actionSelectors.edit) {
            selectors.actionSelectors[`edit${this.toPascalCase(nestedConfig.name)}`] = nestedConfig.actionSelectors.edit;
          }
          if (nestedConfig.actionSelectors.apply) {
            selectors.actionSelectors.applyConfig = nestedConfig.actionSelectors.apply;
          }
          if (nestedConfig.actionSelectors.discard) {
            selectors.actionSelectors.discardConfig = nestedConfig.actionSelectors.discard;
          }
        }
      }
    }

    // Build array fields
    if (definition.arrayFields) {
      for (const arrayField of definition.arrayFields) {
        const arraySchema = this.buildArrayField(arrayField, definition.tooltipData);
        schema.properties[arrayField.name] = arraySchema;
      }
    }

    // Build oneOf discriminators from fields with enum values
    const oneOfOptions = this.buildOneOfFromDiscriminators(definition);
    if (oneOfOptions.length > 0) {
      schema.oneOf = oneOfOptions;
    }

    // Determine timestamp for metadata
    const extractedAt = options?.deterministic
      ? `${definition.version || '1.0.0'}-stable`
      : (options?.extractedAt || new Date().toISOString());

    // Add extraction metadata
    schema['x-f5xc-metadata'] = {
      formUrl: definition.formUrl || `https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/load_balancers/${definition.resourceType}s`,
      resourceType: definition.resourceType,
      extractedAt,
      version: definition.version || '1.0.0',
      extractionVersion: '3.0.0-unified',
      extractionMethod: 'property-builder',
      nestedConfigurations: nestedConfigNames.length > 0 ? nestedConfigNames : undefined,
    };

    // Calculate coverage metrics
    const totalTopLevel = definition.fields.length;
    const totalNested = definition.nestedConfigs?.reduce((sum, nc) => sum + nc.fields.length, 0) || 0;
    const totalArrayFields = definition.arrayFields?.reduce((sum, af) => {
      if (af.itemTypes) {
        return sum + Object.values(af.itemTypes).reduce((s, it) => s + it.fields.length, 0);
      }
      return sum;
    }, 0) || 0;
    const totalFields = totalTopLevel + totalNested + totalArrayFields;
    const fieldsWithDefaults = [
      ...definition.fields.filter(f => f.defaultValue !== undefined),
      ...(definition.nestedConfigs?.flatMap(nc => nc.fields.filter(f => f.defaultValue !== undefined)) || []),
    ].length;

    const metadata = {
      formUrl: definition.formUrl || '',
      resourceType: definition.resourceType,
      extractedAt,
      version: definition.version || '1.0.0',
      extractionVersion: '3.0.0-unified',
      coverage: {
        totalFields,
        topLevelFields: totalTopLevel,
        nestedFields: totalNested + totalArrayFields,
        nestedConfigurations: definition.nestedConfigs?.length || 0,
        fieldsWithSelectors: totalFields,
        fieldsWithTooltips: Object.keys(definition.tooltipData).length,
        fieldsWithDefaults,
        percentage: 100,
      },
      warnings: [],
    };

    return { schema, selectors, metadata };
  }

  /**
   * Build a property object from a field definition
   */
  buildProperty(field: FieldDefinition, tooltipData: Record<string, string>): any {
    const property: any = {
      type: field.type,
      description: tooltipData[field.name] || `${field.label} field`,
      'x-f5xc-field': {
        inputType: this.getInputType(field.type),
        uiLabel: field.label,
        apiProperty: field.apiProperty || field.name,
        advanced: field.advanced || false,
      },
    };

    // Add default value
    if (field.defaultValue !== undefined) {
      property.default = field.defaultValue;
      property['x-f5xc-ui'] = property['x-f5xc-ui'] || {};
      property['x-f5xc-ui'].defaultValue = Array.isArray(field.defaultValue)
        ? JSON.stringify(field.defaultValue)
        : String(field.defaultValue);
    }

    // Add placeholder
    if (field.placeholder) {
      property['x-f5xc-ui'] = property['x-f5xc-ui'] || {};
      property['x-f5xc-ui'].placeholder = field.placeholder;
    }

    // Add unit
    if (field.unit) {
      property['x-f5xc-ui'] = property['x-f5xc-ui'] || {};
      property['x-f5xc-ui'].unit = field.unit;
    }

    // Add enum for dropdown fields
    if (field.enum) {
      property.enum = field.enum;
    }

    // Add enum descriptions
    if (field.enumDescriptions) {
      property['x-f5xc-enum-descriptions'] = field.enumDescriptions;
    }

    // Add conditional visibility
    if (field.conditionalOn) {
      property['x-f5xc-conditional'] = field.conditionalOn;
    }

    // Add array item type
    if (field.type === 'array' && field.itemType) {
      property.items = field.itemType;
    }

    // Add min/max items for arrays
    if (field.minItems !== undefined) {
      property.minItems = field.minItems;
    }
    if (field.maxItems !== undefined) {
      property.maxItems = field.maxItems;
    }

    // ============================================
    // Data Input Constraints
    // ============================================

    // Number constraints
    if (field.type === 'number') {
      if (field.minimum !== undefined) {
        property.minimum = field.minimum;
      }
      if (field.maximum !== undefined) {
        property.maximum = field.maximum;
      }
      if (field.exclusiveMinimum !== undefined) {
        property.exclusiveMinimum = field.exclusiveMinimum;
      }
      if (field.exclusiveMaximum !== undefined) {
        property.exclusiveMaximum = field.exclusiveMaximum;
      }
      if (field.multipleOf !== undefined) {
        property.multipleOf = field.multipleOf;
      }
    }

    // String constraints
    if (field.type === 'string') {
      // minLength: use explicit value, or default to 1 for required fields
      if (field.minLength !== undefined) {
        property.minLength = field.minLength;
      } else if (field.required) {
        property.minLength = 1;
      }

      // maxLength
      if (field.maxLength !== undefined) {
        property.maxLength = field.maxLength;
      }

      // pattern (regex)
      if (field.pattern) {
        property.pattern = field.pattern;
        // Add pattern description for better error messages
        if (field.patternDescription) {
          property['x-f5xc-pattern-description'] = field.patternDescription;
        }
      }

      // format
      if (field.format) {
        property.format = field.format;
      }
    }

    return property;
  }

  /**
   * Build a nested configuration schema
   */
  buildNestedConfig(config: NestedConfigDefinition, tooltipData: Record<string, string>): any {
    const nestedSchema: any = {
      type: 'object',
      description: config.description || tooltipData[config.name] || `${config.name} configuration`,
      'x-f5xc-nested': {
        trigger: config.trigger,
        value: config.triggerValue,
      },
      properties: {},
      required: [],
    };

    for (const field of config.fields) {
      nestedSchema.properties[field.name] = this.buildProperty(field, tooltipData);
      if (field.required) {
        nestedSchema.required.push(field.name);
      }
    }

    return nestedSchema;
  }

  /**
   * Build an array field schema with optional item discriminators
   */
  buildArrayField(arrayDef: ArrayFieldDefinition, tooltipData: Record<string, string>): any {
    const arraySchema: any = {
      type: 'array',
      description: tooltipData[arrayDef.name] || arrayDef.description || `Array of ${arrayDef.name}`,
    };

    if (arrayDef.minItems !== undefined) {
      arraySchema.minItems = arrayDef.minItems;
    }
    if (arrayDef.maxItems !== undefined) {
      arraySchema.maxItems = arrayDef.maxItems;
    }

    // Build items schema
    if (arrayDef.itemTypes && arrayDef.itemDiscriminator) {
      // Discriminated array with multiple item types
      arraySchema.items = {
        oneOf: Object.entries(arrayDef.itemTypes).map(([typeValue, typeDef]) => {
          const itemSchema: any = {
            type: 'object',
            properties: {
              [arrayDef.itemDiscriminator!]: {
                const: typeValue,
                description: `When ${arrayDef.itemDiscriminator} is ${typeValue}`,
              },
            },
            required: typeDef.requiredFields || [],
          };

          for (const field of typeDef.fields) {
            itemSchema.properties[field.name] = this.buildProperty(field, tooltipData);
          }

          return itemSchema;
        }),
      };

      arraySchema['x-f5xc-array'] = {
        addButtonLabel: arrayDef.addButtonLabel || `Add ${this.capitalizeFirst(arrayDef.name.replace(/_/g, ' '))}`,
        itemDiscriminator: arrayDef.itemDiscriminator,
      };
    } else if (arrayDef.itemSchema) {
      // Homogeneous array with single item type
      arraySchema.items = arrayDef.itemSchema;
    }

    return arraySchema;
  }

  /**
   * Build oneOf discriminator options from fields with enum values
   */
  buildOneOfFromDiscriminators(definition: ResourceDefinition): any[] {
    const oneOfOptions: any[] = [];

    // Find discriminator fields (fields with enum that trigger nested configs)
    const discriminatorFields = definition.fields.filter(f =>
      f.enum && definition.nestedConfigs?.some(nc => nc.trigger === f.name)
    );

    for (const field of discriminatorFields) {
      for (const value of field.enum!) {
        oneOfOptions.push({
          properties: {
            [field.name]: { const: value },
          },
          required: [field.name],
        });
      }
    }

    return oneOfOptions;
  }

  /**
   * Get input type string from field type
   */
  private getInputType(type: string): string {
    switch (type) {
      case 'number':
        return 'spinbutton';
      case 'boolean':
        return 'checkbox';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'textbox';
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert snake_case to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => this.capitalizeFirst(word))
      .join('');
  }
}

/**
 * Export singleton instance for convenience
 */
export const propertyBuilder = new PropertyBuilder();
