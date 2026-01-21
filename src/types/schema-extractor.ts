// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Schema Extractor Type Definitions
 *
 * Types for extracting JSON Schema from F5 XC Console forms through DOM mutation analysis.
 * Supports oneOf relationship detection, conditional field dependencies, and schema generation.
 */

import { FormField, InputType } from './navigation';
import { DetectedFormField } from '../handlers/form-handler';

/**
 * Describes a field mutation observed during DOM state changes
 */
export interface FieldMutation {
  /** Field name/label */
  fieldName: string;
  /** Type of mutation */
  mutationType: 'appeared' | 'disappeared' | 'modified';
  /** Form state when mutation occurred */
  triggerState: {
    /** Dropdown/field that triggered the mutation */
    fieldName: string;
    /** Value that was selected */
    value: string;
  };
  /** Field metadata after mutation */
  fieldMetadata?: FormField;
}

/**
 * Represents a oneOf relationship between fields
 * E.g., Health Check type selection determines which config fields appear
 */
export interface OneOfRelationship {
  /** Field that controls the oneOf (discriminator) */
  discriminatorField: string;
  /** Possible option values and their exclusive field sets */
  options: OneOfOption[];
  /** Description of the relationship */
  description?: string;
}

/**
 * Single option within a oneOf relationship
 */
export interface OneOfOption {
  /** Value of the discriminator field */
  optionValue: string;
  /** Fields that are exclusively shown for this option */
  exclusiveFields: string[];
  /** Fields that are required when this option is selected */
  requiredFields?: string[];
  /** Nested oneOf relationships within this option */
  nestedOneOf?: OneOfRelationship[];
}

/**
 * Conditional dependency between fields
 * E.g., "Custom Value" field only appears when "Host Header" = "custom"
 */
export interface ConditionalDependency {
  /** Field that controls the visibility */
  controlField: string;
  /** Value(s) of control field that enable the dependent fields */
  enabledWhen: string | string[];
  /** Fields that become visible/required */
  dependentFields: string[];
  /** Whether dependent fields are required when visible */
  requiredWhenVisible: boolean;
}

/**
 * Metadata about an extracted schema
 */
export interface SchemaMetadata {
  /** URL of the form that was extracted */
  formUrl: string;
  /** Resource type (e.g., 'healthcheck', 'origin_pool') */
  resourceType: string;
  /** Timestamp of extraction */
  extractedAt: string;
  /** Schema version */
  version: string;
  /** Fields that require "Show Advanced Fields" toggle */
  advancedFields?: string[];
  /** Nested configuration sections (e.g., "Edit HTTP Configuration") */
  nestedConfigurations?: NestedConfiguration[];
  /** Any warnings or limitations during extraction */
  warnings?: string[];
}

/**
 * Nested configuration that opens in a dialog or sub-form
 */
export interface NestedConfiguration {
  /** Trigger element (button/link) that opens the nested config */
  trigger: string;
  /** Fields within the nested configuration */
  fields: string[];
  /** Dialog title or identifier */
  dialogTitle?: string;
}

/**
 * JSON Schema draft-07 structure
 * Subset of full spec, focused on F5 XC form needs
 */
export interface JSONSchema {
  /** Schema version */
  $schema?: string;
  /** Schema title */
  title?: string;
  /** Schema description */
  description?: string;
  /** Root type (typically 'object' for forms) */
  type?: JSONSchemaType;
  /** Const value (for discriminator constraints) */
  const?: any;
  /** Object properties */
  properties?: Record<string, JSONSchemaProperty>;
  /** Required property names */
  required?: string[];
  /** OneOf alternatives */
  oneOf?: JSONSchema[];
  /** AllOf combinations */
  allOf?: JSONSchema[];
  /** AnyOf alternatives */
  anyOf?: JSONSchema[];
  /** If/then/else conditional */
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;
  /** Additional properties allowed */
  additionalProperties?: boolean | JSONSchema;
  /** Property definitions */
  definitions?: Record<string, JSONSchema>;
  /** Custom F5 XC metadata */
  'x-f5xc-metadata'?: SchemaMetadata;
}

/**
 * JSON Schema property definition
 */
export interface JSONSchemaProperty {
  /** Property type */
  type?: JSONSchemaType | JSONSchemaType[];
  /** Property description */
  description?: string;
  /** Default value */
  default?: any;
  /** Enum values for select/radio fields */
  enum?: any[];
  /** Const value (single allowed value) */
  const?: any;
  /** String pattern (regex) */
  pattern?: string;
  /** Minimum value (numbers) */
  minimum?: number;
  /** Maximum value (numbers) */
  maximum?: number;
  /** Minimum length (strings/arrays) */
  minLength?: number;
  /** Maximum length (strings/arrays) */
  maxLength?: number;
  /** Array items schema */
  items?: JSONSchema | JSONSchema[];
  /** Object properties (for nested objects) */
  properties?: Record<string, JSONSchemaProperty>;
  /** Required properties (for nested objects) */
  required?: string[];
  /** OneOf alternatives */
  oneOf?: JSONSchema[];
  /** AllOf combinations */
  allOf?: JSONSchema[];
  /** Reference to definition */
  $ref?: string;
  /** Custom F5 XC field metadata */
  'x-f5xc-field'?: {
    /** Original input type from form */
    inputType: InputType;
    /** UI selector metadata */
    selector?: string;
    /** Whether this is an advanced field */
    advanced?: boolean;
    /** Nested configuration reference */
    nestedConfig?: string;
    /** UI label (friendly label from accessibility tree) */
    uiLabel?: string;
    /** API property path (mapping from UI to API) */
    apiProperty?: string;
  };
  /** Custom F5 XC validation metadata */
  'x-f5xc-validation'?: {
    /** Regex pattern for validation */
    pattern?: string;
    /** Minimum value (numbers) */
    minimum?: number;
    /** Maximum value (numbers) */
    maximum?: number;
    /** Minimum length (strings/arrays) */
    minLength?: number;
    /** Maximum length (strings/arrays) */
    maxLength?: number;
  };
  /** Custom F5 XC UI behavior metadata */
  'x-f5xc-ui'?: {
    /** Visibility rule */
    visibilityRule?: 'always' | 'conditional';
    /** Default value from UI */
    defaultValue?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Help text (tooltip/description) */
    helpText?: string;
  };
  /** Custom F5 XC API metadata */
  'x-f5xc-api'?: {
    /** Server-applied default value */
    serverDefault?: any;
    /** Is this field part of minimum configuration */
    minimumConfiguration?: boolean;
    /** Required for API submission */
    requiredForAPI?: boolean;
  };
}

/**
 * JSON Schema primitive types
 */
export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

/**
 * Form state snapshot for oneOf detection
 */
export interface FormStateSnapshot {
  /** Unique identifier for this state */
  stateId: string;
  /** Description of what triggered this state */
  trigger: {
    /** Field that was changed */
    fieldName: string;
    /** Value that was selected */
    value: string;
  };
  /** All visible fields in this state */
  visibleFields: string[];
  /** All required fields in this state */
  requiredFields: string[];
  /** Complete field metadata */
  fieldMetadata: Record<string, any>;
}

/**
 * Result of oneOf detection analysis
 */
export interface OneOfAnalysisResult {
  /** Detected oneOf relationships */
  relationships: OneOfRelationship[];
  /** Conditional dependencies detected */
  conditionalDependencies: ConditionalDependency[];
  /** Field mutations observed */
  mutations: FieldMutation[];
  /** Analysis confidence (0-1) */
  confidence: number;
  /** Any ambiguities or uncertainties */
  ambiguities?: string[];
}

/**
 * Configuration for schema extraction process
 */
export interface SchemaExtractionConfig {
  /** Whether to expand "Show Advanced Fields" */
  expandAdvancedFields: boolean;
  /** Whether to extract nested configurations */
  extractNestedConfigs: boolean;
  /** Maximum depth for nested config exploration */
  maxNestingDepth: number;
  /** Timeout for DOM stabilization after interactions (ms) */
  domStabilizationTimeout: number;
  /** Whether to capture screenshots during extraction */
  captureScreenshots: boolean;
  /** Output directory for schemas */
  outputDir: string;
  /** Whether to validate generated schemas */
  validateSchema: boolean;
}

/**
 * Input to schema generation
 */
export interface SchemaGenerationInput {
  /** Base form fields (maximum expanded state) */
  formFields: DetectedFormField[];
  /** Detected oneOf relationships */
  oneOfRelationships: OneOfRelationship[];
  /** Conditional dependencies */
  conditionalDependencies?: ConditionalDependency[];
  /** Extraction metadata */
  metadata: SchemaMetadata;
  /** Original form URL */
  formUrl: string;
}

/**
 * Output from schema generation
 */
export interface SchemaGenerationOutput {
  /** Generated JSON Schema */
  schema: JSONSchema;
  /** Selector metadata for form automation */
  selectorMetadata: SelectorMetadata;
  /** Generation warnings/notes */
  warnings: string[];
  /** Coverage statistics */
  coverage: {
    /** Total fields in form */
    totalFields: number;
    /** Fields included in schema */
    schemaFields: number;
    /** Fields with selectors */
    fieldsWithSelectors: number;
    /** Coverage percentage */
    percentage: number;
  };
}

/**
 * Selector metadata for automated form filling
 */
export interface SelectorMetadata {
  /** Resource type identifier */
  resourceType: string;
  /** Field name to selector mapping */
  fieldSelectors: Record<
    string,
    {
      /** JSON Schema path (e.g., "properties.metadata.properties.name") */
      schemaPath: string;
      /** CSS selector or other selector type */
      selector: string;
      /** Input type */
      inputType: InputType;
      /** Required for submission */
      required: boolean;
    }
  >;
  /** Action button selectors (submit, cancel, etc.) */
  actionSelectors: Record<string, string>;
  /** Nested configuration triggers */
  nestedConfigTriggers?: Record<string, string>;
}

/**
 * Error types during schema extraction
 */
export type SchemaExtractionError =
  | 'FORM_NOT_FOUND'
  | 'DOM_TIMEOUT'
  | 'INVALID_STATE'
  | 'SELECTOR_FAILED'
  | 'NESTED_CONFIG_ERROR'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * Schema extraction error with context
 */
export interface SchemaExtractionErrorDetails {
  /** Error type */
  type: SchemaExtractionError;
  /** Error message */
  message: string;
  /** Context/stack trace */
  context?: any;
  /** Recovery suggestions */
  suggestions?: string[];
}
