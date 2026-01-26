// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Array Field Handler
 *
 * Detects and models array fields (repeating configuration blocks) in F5 XC forms.
 * Handles "Add Item" buttons, dynamic tables, and array item templates.
 *
 * Phase 2 feature for origin_pool extraction.
 */

import { ParsedSnapshot, ParsedElement } from '../mcp/snapshot-parser';
import { DetectedFormField } from './form-handler';
import { OneOfRelationship } from '../types/schema-extractor';

/**
 * Information about a detected array field
 */
export interface ArrayFieldInfo {
  /** Field name (e.g., "origin_servers") */
  fieldName: string;
  /** API property path */
  apiProperty: string;
  /** Selector for "Add Item" button */
  addButtonSelector: string;
  /** Button text/label */
  addButtonLabel: string;
  /** Container selector (parent element containing array items) */
  containerSelector?: string;
  /** Minimum number of items required */
  minItems?: number;
  /** Maximum number of items allowed */
  maxItems?: number;
}

/**
 * Template for array item structure
 */
export interface ArrayItemTemplate {
  /** Fields within a single array item */
  fields: DetectedFormField[];
  /** Discriminator field within the item (e.g., "origin_server_type") */
  discriminator?: string;
  /** OneOf options for the discriminator */
  discriminatorOptions?: string[];
  /** JSON Schema for array items */
  itemSchema: any;
}

/**
 * Array field detection patterns
 */
const ARRAY_BUTTON_PATTERNS = {
  addItem: /add\s+.*(item|server|entry|row|check)/i,
  addMore: /add\s+more/i,
  addAnother: /add\s+another/i,
  plusButton: /^\+$|^add$/i,
};

/**
 * Array Field Handler
 *
 * Detects array fields and generates proper array schemas with item templates.
 */
export class ArrayFieldHandler {
  private detectedArrays: Map<string, ArrayFieldInfo> = new Map();

  /**
   * Detect array fields by looking for "Add Item" buttons
   *
   * @param snapshot - Parsed accessibility tree snapshot
   * @returns Detected array field information
   */
  detectArrayFields(snapshot: ParsedSnapshot): ArrayFieldInfo[] {
    const arrayFields: ArrayFieldInfo[] = [];

    // Find all button elements
    const buttons = snapshot.elements.filter(
      el => el.role === 'button' && el.name
    );

    for (const button of buttons) {
      // Skip buttons without names
      if (!button.name) continue;

      // Check if button matches array addition patterns
      if (this.isAddItemButton(button.name)) {
        const arrayName = this.extractArrayNameFromButton(button.name);
        if (arrayName) {
          const arrayInfo: ArrayFieldInfo = {
            fieldName: arrayName,
            apiProperty: this.fieldNameToApiPath(arrayName),
            addButtonSelector: button.uid,
            addButtonLabel: button.name,
            containerSelector: this.findArrayContainer(button, snapshot),
          };

          arrayFields.push(arrayInfo);
          this.detectedArrays.set(arrayName, arrayInfo);
        }
      }
    }

    return arrayFields;
  }

  /**
   * Check if button is an "Add Item" button
   */
  private isAddItemButton(buttonText: string): boolean {
    for (const pattern of Object.values(ARRAY_BUTTON_PATTERNS)) {
      if (pattern.test(buttonText)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extract array field name from button text
   *
   * "Add Origin Server" → "origin_servers"
   * "Add Item" → "items"
   * "Add More Certificates" → "certificates"
   */
  private extractArrayNameFromButton(buttonText: string): string | null {
    // Remove "Add" prefix and common words
    let name = buttonText
      .replace(/^add\s+/i, '')
      .replace(/^(more|another)\s+/i, '')  // Also remove "more" or "another" prefix
      .replace(/\s+(item|entry|row)$/i, '')  // Remove common suffixes
      .trim();

    if (!name) {
      return 'items'; // Default fallback
    }

    // Convert to snake_case and pluralize
    name = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Add plural 's' if not already plural
    if (!name.endsWith('s')) {
      name += 's';
    }

    return name;
  }

  /**
   * Convert field name to API property path
   */
  private fieldNameToApiPath(fieldName: string): string {
    // For now, assume direct mapping
    // In production, would consult field-mappings.yaml
    return fieldName;
  }

  /**
   * Find container element for array items
   *
   * Looks for parent elements that likely contain the array items
   */
  private findArrayContainer(
    button: ParsedElement,
    snapshot: ParsedSnapshot
  ): string | undefined {
    // Find elements at same or higher level that might be containers
    const potentialContainers = snapshot.elements.filter(
      el =>
        el.level <= button.level &&
        (el.role === 'group' ||
          el.role === 'list' ||
          el.role === 'table' ||
          el.role === 'region')
    );

    // Return the closest container above the button
    if (potentialContainers.length > 0) {
      return potentialContainers[potentialContainers.length - 1].uid;
    }

    return undefined;
  }

  /**
   * Capture array item template by analyzing fields after "Add Item"
   *
   * This would be called after clicking "Add Item" in browser automation
   *
   * @param arrayInfo - Array field information
   * @param itemFields - Fields detected within the new array item
   * @param discriminatorField - Optional discriminator field name
   * @returns Array item template
   */
  captureArrayItemTemplate(
    arrayInfo: ArrayFieldInfo,
    itemFields: DetectedFormField[],
    discriminatorField?: string
  ): ArrayItemTemplate {
    const template: ArrayItemTemplate = {
      fields: itemFields,
      itemSchema: this.buildItemSchema(itemFields),
    };

    // If discriminator field provided, extract options
    if (discriminatorField) {
      const discriminator = itemFields.find(f => f.name === discriminatorField);
      if (discriminator && discriminator.options) {
        template.discriminator = discriminatorField;
        template.discriminatorOptions = discriminator.options;
      }
    }

    return template;
  }

  /**
   * Build JSON Schema for array items
   *
   * @param fields - Fields within array item
   * @returns Item schema object
   */
  private buildItemSchema(fields: DetectedFormField[]): any {
    const properties: any = {};
    const required: string[] = [];

    for (const field of fields) {
      const propName = this.fieldNameToPropertyName(field.name);
      properties[propName] = {
        type: this.mapInputTypeToSchemaType(field.type),
        description: field.name,
      };

      if (field.required) {
        required.push(propName);
      }

      if (field.options && field.options.length > 0) {
        properties[propName].enum = field.options;
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  /**
   * Generate complete array field schema with items
   *
   * @param arrayInfo - Array field information
   * @param itemTemplate - Template for array items
   * @param itemOneOf - Optional oneOf for discriminated items
   * @returns Complete array schema
   */
  generateArraySchema(
    arrayInfo: ArrayFieldInfo,
    itemTemplate: ArrayItemTemplate,
    itemOneOf?: OneOfRelationship
  ): any {
    const arraySchema: any = {
      type: 'array',
      description: `Array of ${arrayInfo.fieldName}`,
      minItems: arrayInfo.minItems ?? 1,
    };

    if (arrayInfo.maxItems) {
      arraySchema.maxItems = arrayInfo.maxItems;
    }

    // If oneOf exists for items, use it
    if (itemOneOf && itemTemplate.discriminator) {
      arraySchema.items = {
        oneOf: this.buildItemOneOfSchemas(itemOneOf, itemTemplate),
      };
    } else {
      // Otherwise use simple item schema
      arraySchema.items = itemTemplate.itemSchema;
    }

    // Add metadata for form automation
    arraySchema['x-f5xc-array'] = {
      addButtonSelector: arrayInfo.addButtonSelector,
      addButtonLabel: arrayInfo.addButtonLabel,
      containerSelector: arrayInfo.containerSelector,
      itemDiscriminator: itemTemplate.discriminator,
    };

    return arraySchema;
  }

  /**
   * Build oneOf schemas for discriminated array items
   *
   * @param oneOfRel - OneOf relationship for items
   * @param template - Array item template
   * @returns Array of oneOf option schemas
   */
  private buildItemOneOfSchemas(
    oneOfRel: OneOfRelationship,
    template: ArrayItemTemplate
  ): any[] {
    const oneOfSchemas: any[] = [];

    for (const option of oneOfRel.options) {
      const optionSchema: any = {
        type: 'object',
        properties: {},
        required: [],
      };

      // Add discriminator constraint
      if (template.discriminator) {
        const discriminatorProp = this.fieldNameToPropertyName(template.discriminator);
        optionSchema.properties[discriminatorProp] = {
          const: option.optionValue,
          description: `When ${template.discriminator} is ${option.optionValue}`,
        };
      }

      // Add exclusive fields for this option
      for (const fieldName of option.exclusiveFields) {
        const field = template.fields.find(f => f.name === fieldName);
        if (field) {
          const propName = this.fieldNameToPropertyName(fieldName);
          optionSchema.properties[propName] = {
            type: this.mapInputTypeToSchemaType(field.type),
            description: fieldName,
          };

          if (field.required || option.requiredFields?.includes(fieldName)) {
            optionSchema.required.push(propName);
          }
        }
      }

      oneOfSchemas.push(optionSchema);
    }

    return oneOfSchemas;
  }

  /**
   * Map input type to JSON Schema type
   */
  private mapInputTypeToSchemaType(inputType: string): string {
    const typeMap: Record<string, string> = {
      textbox: 'string',
      select: 'string',
      combobox: 'string',
      checkbox: 'boolean',
      radio: 'string',
      spinbutton: 'number',
      listbox: 'string',
      switch: 'boolean',
    };

    return typeMap[inputType] || 'string';
  }

  /**
   * Convert field name to property name (snake_case)
   */
  private fieldNameToPropertyName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Get detected array fields
   */
  getDetectedArrays(): Map<string, ArrayFieldInfo> {
    return this.detectedArrays;
  }

  /**
   * Check if a field name is an array field
   */
  isArrayField(fieldName: string): boolean {
    return this.detectedArrays.has(fieldName);
  }

  /**
   * Get array field info by name
   */
  getArrayFieldInfo(fieldName: string): ArrayFieldInfo | undefined {
    return this.detectedArrays.get(fieldName);
  }
}
