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
 * Deferred features not yet implemented in current extraction phase
 * Used to track MVP limitations and guide future enhancements
 */
export interface DeferredFeatures {
  /** Array fields not yet modeled as arrays (e.g., origin_servers) */
  arrayFields?: string[];
  /** API reference fields using placeholder enums instead of live API lookups */
  apiReferences?: Array<{
    /** Field name (e.g., "health_check_reference") */
    field: string;
    /** Referenced resource type (e.g., "healthcheck") */
    resourceType: string;
    /** API endpoint path for fetching valid values */
    apiPath: string;
  }>;
  /** Fields requiring deeper nesting than currently supported (>2 levels) */
  deepNesting?: string[];
}

/**
 * API discovery status tracking
 * Tracks whether API discovery was attempted and the resolution status of API reference fields
 */
export interface ApiDiscoveryStatus {
  /** Whether API discovery was enabled for this extraction */
  enabled: boolean;
  /** API reference fields and their resolution status */
  references: Array<{
    /** Field name (e.g., "health_check") */
    field: string;
    /** Referenced resource type (e.g., "healthcheck") */
    resourceType: string;
    /** true if API succeeded, false if fallback used */
    resolved: boolean;
    /** ISO timestamp if resolved successfully */
    lastFetched?: string;
    /** Whether placeholder fallback values were used */
    fallbackUsed?: boolean;
  }>;
}

/**
 * Metadata about an extracted schema
 */
export interface SchemaMetadata {
  /** URL of the form that was extracted */
  formUrl: string;
  /** Resource type (e.g., 'healthcheck', 'origin_pool') */
  resourceType: string;
  /** ISO timestamp of extraction for idempotency tracking */
  extractedAt: string;
  /** Schema version */
  version: string;
  /** Extraction script version for reproducibility */
  extractionVersion: string;
  /** F5 XC namespace for API operations */
  namespace?: string;
  /** Fields that require "Show Advanced Fields" toggle */
  advancedFields?: string[];
  /** Nested configuration sections (e.g., "Edit HTTP Configuration") */
  nestedConfigurations?: NestedConfiguration[];
  /** Any warnings or limitations during extraction */
  warnings?: string[];
  /** Deferred features not yet implemented (MVP tracking) */
  deferredFeatures?: DeferredFeatures;
  /** API discovery status and reference field resolution tracking */
  apiDiscovery?: ApiDiscoveryStatus;
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
    /** Whether this is an API reference field (dropdown populated from API) */
    isAPIReference?: boolean;
    /** Referenced resource type if isAPIReference is true */
    referencedResourceType?: string;
    /** Uses placeholder enum instead of live API values (Phase 1 MVP) */
    usesPlaceholder?: boolean;
    /** Timestamp when API values were last fetched (Phase 3) */
    lastFetched?: string;
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

/**
 * Global configuration from field-mappings.yaml v2.0
 * Contains settings shared across all resource types
 */
export interface GlobalConfig {
  /** Configuration file version */
  version: string;
  /** API reference configuration for dynamic enums */
  api_references: Record<string, ApiReferenceConfig>;
  /** Default settings for extraction and export */
  defaults: {
    /** Extraction behavior defaults */
    extraction: {
      maxNestingDepth: number;
      domStabilizationTimeout: number;
      captureScreenshots: boolean;
      validateSchema: boolean;
      expandAdvancedFields: boolean;
      extractNestedConfigs: boolean;
    };
    /** Export behavior defaults */
    export: {
      outputDir: string;
      includeSelectors: boolean;
      includeReport: boolean;
    };
  };
}

/**
 * API reference configuration for fetching dynamic enum values
 */
export interface ApiReferenceConfig {
  /** API endpoint path */
  api_path: string;
  /** Field containing the value */
  value_field: string;
  /** Whether to cache results */
  cacheable: boolean;
  /** Cache TTL in seconds */
  cache_ttl: number;
  /** Fallback placeholder values if API fails */
  placeholder_fallback: string[];
  /** Description of this reference */
  description?: string;
}

/**
 * Resource-specific configuration from field-mappings.yaml v2.0
 */
export interface ResourceConfig {
  /** Resource type identifier */
  resourceType: string;
  /** Human-readable description */
  description: string;
  /** API type identifier */
  api_type: string;
  /** Resource metadata */
  metadata?: {
    formUrl?: string;
    formTitle?: string;
    complexity?: number;
  };
  /** Field mappings (UI to API property paths) */
  field_mappings?: Record<string, string>;
  /** Discriminator fields for oneOf relationships */
  discriminators?: Array<{
    field: string;
    api_property: string;
    options: Record<string, { api_path?: string; nested_config?: any }>;
  }>;
  /** Array field configurations */
  arrays?: Array<{
    field: string;
    api_property: string;
    min_items?: number;
    max_items?: number;
    add_button_text?: string;
    item_discriminator?: string;
    description?: string;
    item_types?: Record<string, { api_path?: string; fields?: Record<string, string>; required?: string[]; description?: string }>;
  }>;
  /** Validation rules */
  validation_rules?: {
    required_api_fields?: string[];
    mutually_exclusive?: string[][];
    field_constraints?: Record<string, {
      type?: string;
      min?: number;
      max?: number;
      min_items?: number;
      max_items?: number;
    }>;
  };
  /** API reference fields */
  reference_fields?: Array<{
    field: string;
    type: string;
    api_property: string;
    reference_type: string;
    required: boolean;
    description?: string;
    fallback_behavior?: string;
  }>;
  /** Nested configuration mappings */
  nested_configs?: Record<string, any>;
  /** Merged global defaults */
  defaults?: {
    extraction: {
      maxNestingDepth: number;
      domStabilizationTimeout: number;
      captureScreenshots: boolean;
      validateSchema: boolean;
      expandAdvancedFields: boolean;
      extractNestedConfigs: boolean;
    };
    export: {
      outputDir: string;
      includeSelectors: boolean;
      includeReport: boolean;
    };
  };
  /** API references from global config */
  globalApiReferences?: Record<string, ApiReferenceConfig>;
}
