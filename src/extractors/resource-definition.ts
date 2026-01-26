// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Resource Definition Interfaces
 *
 * Declarative structure for defining F5 XC resource schemas.
 * Supports fields, nested configs, array fields with discriminators,
 * and tooltip/default value capture.
 */

/**
 * Complete resource definition for schema generation
 */
export interface ResourceDefinition {
  /** Resource type identifier (e.g., 'healthcheck', 'origin_pool') */
  resourceType: string;
  /** Schema title for documentation */
  title: string;
  /** Schema description */
  description?: string;
  /** Top-level field definitions */
  fields: FieldDefinition[];
  /** Nested configuration definitions (conditional sections) */
  nestedConfigs?: NestedConfigDefinition[];
  /** Array field definitions (for multi-item fields like origin_servers) */
  arrayFields?: ArrayFieldDefinition[];
  /** Tooltip data captured from UI */
  tooltipData: Record<string, string>;
  /** Section-level tooltip data */
  sectionTooltips?: Record<string, string>;
  /** Enum descriptions for discriminator fields */
  enumDescriptions?: Record<string, Record<string, string>>;
  /** Form URL for extraction metadata */
  formUrl?: string;
  /** Schema version */
  version?: string;
}

/**
 * Field definition for both top-level and nested fields
 */
export interface FieldDefinition {
  /** Field name (snake_case, matches API property) */
  name: string;
  /** UI label displayed in form */
  label: string;
  /** JSON Schema type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Whether field is required */
  required: boolean;
  /** Whether field is in advanced section */
  advanced?: boolean;
  /** Default value */
  defaultValue?: any;
  /** Enum values for dropdown/select fields */
  enum?: string[];
  /** Enum value descriptions */
  enumDescriptions?: Record<string, string>;
  /** Unit suffix (e.g., 'seconds', 'percent') */
  unit?: string;
  /** Placeholder text */
  placeholder?: string;
  /** CSS/ARIA selector for info icon (tooltip source) */
  infoIconSelector?: string;
  /** CSS/ARIA selector for input element */
  inputSelector?: string;
  /** API property path override (for nested API structures) */
  apiProperty?: string;
  /** API mapping notes explaining how UI values map to API fields */
  apiNote?: string;
  /** Conditional visibility based on another field */
  conditionalOn?: ConditionalRule;
  /** For array fields, defines item type schema */
  itemType?: ItemTypeDefinition;
  /** Min items for array fields */
  minItems?: number;
  /** Max items for array fields */
  maxItems?: number;
  /** For object fields, nested properties */
  properties?: Record<string, FieldDefinition>;

  // ============================================
  // Data Input Constraints
  // ============================================

  /** Minimum value for number fields */
  minimum?: number;
  /** Maximum value for number fields */
  maximum?: number;
  /** Exclusive minimum for number fields */
  exclusiveMinimum?: number;
  /** Exclusive maximum for number fields */
  exclusiveMaximum?: number;
  /** Minimum length for string fields */
  minLength?: number;
  /** Maximum length for string fields */
  maxLength?: number;
  /** Regex pattern for string validation */
  pattern?: string;
  /** Pattern description for error messages */
  patternDescription?: string;
  /** Standard format (e.g., 'ipv4', 'ipv6', 'hostname', 'uri', 'email') */
  format?: 'ipv4' | 'ipv6' | 'hostname' | 'uri' | 'uri-reference' | 'email' | 'date-time' | 'date' | 'time' | 'duration';
  /** Multiple of constraint for numbers */
  multipleOf?: number;

  // ============================================
  // Validation Control
  // ============================================

  /** UI-only field - not sent directly to API (e.g., discriminators that map to API oneOf blocks) */
  uiOnly?: boolean;
}

/**
 * Conditional visibility rule
 */
export interface ConditionalRule {
  /** Field that controls visibility */
  field: string;
  /** Value(s) that enable this field */
  value: string | string[];
}

/**
 * Nested configuration definition (conditional sections like HTTP/TCP healthcheck)
 */
export interface NestedConfigDefinition {
  /** Config name (e.g., 'http_health_check_config') */
  name: string;
  /** Field that triggers this config's visibility */
  trigger: string;
  /** Value of trigger field that shows this config */
  triggerValue: string;
  /** Fields within this nested config */
  fields: FieldDefinition[];
  /** Description/tooltip for the section */
  description?: string;
  /** API block path for this nested config (e.g., 'spec.ai_risk_based_blocking') */
  apiBlock?: string;
  /** API mapping notes explaining how this config maps to API structure */
  apiNote?: string;
  /** Action selectors for nested config UI */
  actionSelectors?: {
    edit?: string;
    apply?: string;
    discard?: string;
  };
  /** Conditional visibility based on a top-level discriminator field */
  conditionalOn?: ConditionalRule;
}

/**
 * Array field definition with item discriminators
 * Used for fields like origin_servers that have multiple item types
 */
export interface ArrayFieldDefinition {
  /** Field name */
  name: string;
  /** Minimum items required */
  minItems?: number;
  /** Maximum items allowed */
  maxItems?: number;
  /** Add button label in UI */
  addButtonLabel?: string;
  /** Discriminator field name within array items */
  itemDiscriminator?: string;
  /** Different item types based on discriminator value */
  itemTypes?: Record<string, ArrayItemTypeDefinition>;
  /** For homogeneous arrays, the item schema */
  itemSchema?: ItemTypeDefinition;
  /** API property path */
  apiProperty?: string;
  /** Description */
  description?: string;
  /** Conditional visibility based on another field (enables conditional arrays) */
  conditionalOn?: ConditionalRule;
}

/**
 * Array item type definition for discriminated arrays
 */
export interface ArrayItemTypeDefinition {
  /** Fields specific to this item type */
  fields: FieldDefinition[];
  /** Required fields for this item type */
  requiredFields?: string[];
  /** API path prefix for this item type */
  apiPath?: string;
  /** Description of this item type */
  description?: string;
  /** API mapping notes explaining how this item type maps to API structure */
  apiNote?: string;
}

/**
 * Item type definition for array items
 */
export interface ItemTypeDefinition {
  /** Item type (typically 'object' or 'string') */
  type: 'string' | 'number' | 'boolean' | 'object';
  /** For object items, property definitions */
  properties?: Record<string, ItemPropertyDefinition>;
  /** Enum values for string items with predefined options */
  enum?: string[];
  /** Enum value descriptions */
  enumDescriptions?: Record<string, string>;
  /** Minimum length for string items */
  minLength?: number;
  /** Maximum length for string items */
  maxLength?: number;
}

/**
 * Property definition within ItemTypeDefinition objects
 */
export interface ItemPropertyDefinition {
  type: string;
  label?: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  enumDescriptions?: Record<string, string>;
  required?: boolean;
}

/**
 * Selector metadata output structure
 */
export interface SelectorOutput {
  /** Resource type */
  resourceType: string;
  /** Field selectors mapping label to schema path */
  fieldSelectors: Record<string, {
    schemaPath: string;
    inputType: string;
    required: boolean;
    advanced: boolean;
  }>;
  /** Nested config selectors */
  nestedSelectors?: Record<string, Record<string, {
    schemaPath: string;
    inputType: string;
    required: boolean;
    advanced: boolean;
  }>>;
  /** Action button selectors */
  actionSelectors: Record<string, string>;
}

/**
 * Complete schema output structure
 */
export interface SchemaOutput {
  /** Generated JSON Schema */
  schema: any;
  /** Selector metadata */
  selectors: SelectorOutput;
  /** Extraction metadata */
  metadata: {
    formUrl: string;
    resourceType: string;
    extractedAt: string;
    version: string;
    extractionVersion: string;
    coverage: {
      totalFields: number;
      topLevelFields: number;
      nestedFields: number;
      nestedConfigurations: number;
      fieldsWithSelectors: number;
      fieldsWithTooltips: number;
      fieldsWithDefaults: number;
      percentage: number;
    };
    warnings: string[];
  };
}
