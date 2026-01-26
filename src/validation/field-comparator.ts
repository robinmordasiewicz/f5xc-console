// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Field Comparator
 *
 * Compares resource definition fields against API schema properties
 * to identify discrepancies in constraints, enums, types, and requirements.
 */

import { FieldDefinition } from '../extractors/resource-definition';
import { APIPropertyDefinition, extractValidationRules } from './api-schema-loader';

/**
 * Types of discrepancies that can be detected
 */
export type DiscrepancyType =
  | 'constraint'
  | 'enum'
  | 'type'
  | 'required'
  | 'missing'
  | 'format'
  | 'pattern';

/**
 * Severity levels for discrepancies
 */
export type DiscrepancySeverity = 'error' | 'warning' | 'info';

/**
 * A single discrepancy between definition and API
 */
export interface Discrepancy {
  /** Field name in definition */
  field: string;
  /** Type of discrepancy */
  type: DiscrepancyType;
  /** Specific property that differs */
  property: string;
  /** Value in resource definition */
  definitionValue: any;
  /** Value in API schema */
  apiValue: any;
  /** Severity level */
  severity: DiscrepancySeverity;
  /** Suggested fix */
  suggestion: string;
  /** API property path */
  apiPath?: string;
}

/**
 * Comparison result for a single field
 */
export interface FieldComparisonResult {
  field: string;
  valid: boolean;
  discrepancies: Discrepancy[];
}

/**
 * Compare numeric constraints
 */
function compareNumericConstraints(
  field: FieldDefinition,
  apiRules: ReturnType<typeof extractValidationRules>
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  // Compare minimum
  if (field.minimum !== undefined && apiRules.minimum !== undefined) {
    if (field.minimum !== apiRules.minimum) {
      discrepancies.push({
        field: field.name,
        type: 'constraint',
        property: 'minimum',
        definitionValue: field.minimum,
        apiValue: apiRules.minimum,
        severity: 'error',
        suggestion: `Update minimum from ${field.minimum} to ${apiRules.minimum}`,
        apiPath: field.apiProperty,
      });
    }
  }

  // Compare maximum
  if (field.maximum !== undefined && apiRules.maximum !== undefined) {
    if (field.maximum !== apiRules.maximum) {
      discrepancies.push({
        field: field.name,
        type: 'constraint',
        property: 'maximum',
        definitionValue: field.maximum,
        apiValue: apiRules.maximum,
        severity: 'error',
        suggestion: `Update maximum from ${field.maximum} to ${apiRules.maximum}`,
        apiPath: field.apiProperty,
      });
    }
  }

  return discrepancies;
}

/**
 * Compare string constraints
 */
function compareStringConstraints(
  field: FieldDefinition,
  apiRules: ReturnType<typeof extractValidationRules>
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  // Compare minLength
  if (field.minLength !== undefined && apiRules.minLength !== undefined) {
    if (field.minLength !== apiRules.minLength) {
      discrepancies.push({
        field: field.name,
        type: 'constraint',
        property: 'minLength',
        definitionValue: field.minLength,
        apiValue: apiRules.minLength,
        severity: 'warning',
        suggestion: `Update minLength from ${field.minLength} to ${apiRules.minLength}`,
        apiPath: field.apiProperty,
      });
    }
  }

  // Compare maxLength
  if (field.maxLength !== undefined && apiRules.maxLength !== undefined) {
    if (field.maxLength !== apiRules.maxLength) {
      discrepancies.push({
        field: field.name,
        type: 'constraint',
        property: 'maxLength',
        definitionValue: field.maxLength,
        apiValue: apiRules.maxLength,
        severity: field.maxLength < apiRules.maxLength ? 'warning' : 'error',
        suggestion: `Update maxLength from ${field.maxLength} to ${apiRules.maxLength}`,
        apiPath: field.apiProperty,
      });
    }
  }

  return discrepancies;
}

/**
 * Compare array constraints
 */
function compareArrayConstraints(
  field: FieldDefinition,
  apiRules: ReturnType<typeof extractValidationRules>
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  // Compare minItems
  if (field.minItems !== undefined && apiRules.minItems !== undefined) {
    if (field.minItems !== apiRules.minItems) {
      discrepancies.push({
        field: field.name,
        type: 'constraint',
        property: 'minItems',
        definitionValue: field.minItems,
        apiValue: apiRules.minItems,
        severity: 'warning',
        suggestion: `Update minItems from ${field.minItems} to ${apiRules.minItems}`,
        apiPath: field.apiProperty,
      });
    }
  }

  // Compare maxItems
  if (field.maxItems !== undefined && apiRules.maxItems !== undefined) {
    if (field.maxItems !== apiRules.maxItems) {
      discrepancies.push({
        field: field.name,
        type: 'constraint',
        property: 'maxItems',
        definitionValue: field.maxItems,
        apiValue: apiRules.maxItems,
        severity: field.maxItems < apiRules.maxItems ? 'warning' : 'error',
        suggestion: `Update maxItems from ${field.maxItems} to ${apiRules.maxItems}`,
        apiPath: field.apiProperty,
      });
    }
  }

  return discrepancies;
}

/**
 * Normalize enum value for comparison
 */
function normalizeEnumValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Compare enum values
 */
function compareEnumValues(
  field: FieldDefinition,
  apiRules: ReturnType<typeof extractValidationRules>
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  if (!field.enum || !apiRules.enum) {
    return discrepancies;
  }

  // Normalize both sets for comparison
  const defNormalized = new Set(field.enum.map(normalizeEnumValue));
  const apiNormalized = new Set(apiRules.enum.map(normalizeEnumValue));

  // Find values in definition not in API
  const extraInDef = field.enum.filter((v) => !apiNormalized.has(normalizeEnumValue(v)));

  // Find values in API not in definition
  const extraInApi = apiRules.enum.filter((v) => !defNormalized.has(normalizeEnumValue(v)));

  if (extraInDef.length > 0 || extraInApi.length > 0) {
    discrepancies.push({
      field: field.name,
      type: 'enum',
      property: 'enum',
      definitionValue: field.enum,
      apiValue: apiRules.enum,
      severity: 'warning',
      suggestion:
        extraInApi.length > 0
          ? `Add missing API enum values: ${extraInApi.join(', ')}`
          : `Remove extra enum values: ${extraInDef.join(', ')}`,
      apiPath: field.apiProperty,
    });
  }

  return discrepancies;
}

/**
 * Map definition type to JSON Schema type
 */
function mapToJsonSchemaType(type: string): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    number: 'integer',
    boolean: 'boolean',
    object: 'object',
    array: 'array',
  };
  return typeMap[type] || type;
}

/**
 * Compare data types
 */
function compareTypes(
  field: FieldDefinition,
  apiProp: APIPropertyDefinition
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  const defType = mapToJsonSchemaType(field.type);
  const apiType = apiProp.type;

  // Handle special cases
  if (!apiType) {
    // API might use oneOf, allOf, or $ref instead of direct type
    return discrepancies;
  }

  // Number can match integer
  if (
    (defType === 'integer' && apiType === 'number') ||
    (defType === 'number' && apiType === 'integer')
  ) {
    return discrepancies;
  }

  if (defType !== apiType) {
    discrepancies.push({
      field: field.name,
      type: 'type',
      property: 'type',
      definitionValue: field.type,
      apiValue: apiType,
      severity: 'error',
      suggestion: `Update type from ${field.type} to ${apiType}`,
      apiPath: field.apiProperty,
    });
  }

  return discrepancies;
}

/**
 * Compare format constraints
 */
function compareFormat(
  field: FieldDefinition,
  apiProp: APIPropertyDefinition
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  if (field.format && apiProp.format && field.format !== apiProp.format) {
    discrepancies.push({
      field: field.name,
      type: 'format',
      property: 'format',
      definitionValue: field.format,
      apiValue: apiProp.format,
      severity: 'warning',
      suggestion: `Update format from ${field.format} to ${apiProp.format}`,
      apiPath: field.apiProperty,
    });
  }

  return discrepancies;
}

/**
 * Compare a definition field against an API property
 */
export function compareField(
  field: FieldDefinition,
  apiProp: APIPropertyDefinition | undefined
): FieldComparisonResult {
  const discrepancies: Discrepancy[] = [];

  // If no API property found, field might be UI-only or incorrectly mapped
  if (!apiProp) {
    // This is informational - the field might have a complex mapping
    return {
      field: field.name,
      valid: true,
      discrepancies: [],
    };
  }

  // Extract validation rules from API property
  const apiRules = extractValidationRules(apiProp);

  // Compare based on field type
  if (field.type === 'number') {
    discrepancies.push(...compareNumericConstraints(field, apiRules));
  }

  if (field.type === 'string') {
    discrepancies.push(...compareStringConstraints(field, apiRules));
  }

  if (field.type === 'array') {
    discrepancies.push(...compareArrayConstraints(field, apiRules));
  }

  // Compare enum values
  discrepancies.push(...compareEnumValues(field, apiRules));

  // Compare types
  discrepancies.push(...compareTypes(field, apiProp));

  // Compare format
  discrepancies.push(...compareFormat(field, apiProp));

  return {
    field: field.name,
    valid: discrepancies.length === 0,
    discrepancies,
  };
}

/**
 * Generate fix suggestion code snippet
 */
export function generateFixSnippet(discrepancy: Discrepancy): string {
  switch (discrepancy.type) {
    case 'constraint':
      return `${discrepancy.property}: ${JSON.stringify(discrepancy.apiValue)}, // API: ${discrepancy.apiPath || 'unknown'}`;

    case 'enum':
      return `enum: ${JSON.stringify(discrepancy.apiValue)}, // API values`;

    case 'type':
      return `type: '${discrepancy.apiValue}',`;

    case 'format':
      return `format: '${discrepancy.apiValue}',`;

    default:
      return `// ${discrepancy.suggestion}`;
  }
}

/**
 * Calculate severity score for prioritization
 */
export function calculateSeverityScore(discrepancies: Discrepancy[]): number {
  return discrepancies.reduce((score, d) => {
    switch (d.severity) {
      case 'error':
        return score + 10;
      case 'warning':
        return score + 5;
      case 'info':
        return score + 1;
      default:
        return score;
    }
  }, 0);
}

/**
 * Group discrepancies by field
 */
export function groupDiscrepanciesByField(
  discrepancies: Discrepancy[]
): Map<string, Discrepancy[]> {
  const grouped = new Map<string, Discrepancy[]>();

  for (const d of discrepancies) {
    const existing = grouped.get(d.field) || [];
    existing.push(d);
    grouped.set(d.field, existing);
  }

  return grouped;
}

/**
 * Filter discrepancies by severity
 */
export function filterBySeverity(
  discrepancies: Discrepancy[],
  minSeverity: DiscrepancySeverity
): Discrepancy[] {
  const severityOrder: Record<DiscrepancySeverity, number> = {
    error: 3,
    warning: 2,
    info: 1,
  };

  const minOrder = severityOrder[minSeverity];
  return discrepancies.filter((d) => severityOrder[d.severity] >= minOrder);
}
