// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * API Security Common Field Definitions
 *
 * Shared field definitions for F5 XC API Security resource types.
 * Eliminates duplication across api_definition, api_discovery,
 * code_base_integration, sensitive_data_policy, data_type, and api_groups.
 *
 * IMPORTANT: Validation Constraint Source of Truth
 * ------------------------------------------------
 * The F5 XC API has DIFFERENT maxLength constraints for different resource types:
 *
 *   - Most resources: maxLength=63 (DNS-1035 standard)
 *   - service_policy: maxLength=16 (more restrictive)
 *
 * To verify/update constraints against the API spec, run:
 *   npx ts-node scripts/sync-api-constraints.ts --apply
 *
 * The sync script downloads the official API spec and updates definition files
 * to match actual API constraints. This ensures our schemas validate correctly.
 *
 * @see config/api-constraints.json - Generated constraint analysis
 * @see scripts/sync-api-constraints.ts - Automated constraint sync tool
 */

import { FieldDefinition } from '../../extractors/resource-definition';

/**
 * DNS-1035 compliant name field validation pattern
 * Used across all F5 XC resources for name format validation.
 *
 * Note: The pattern enforces format, but maxLength varies by resource type.
 * Always check API spec via sync-api-constraints.ts for correct maxLength.
 */
export const DNS_1035_PATTERN = '^[a-z][a-z0-9-]*[a-z0-9]$';
export const DNS_1035_PATTERN_DESCRIPTION =
  'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with letter or number';

/**
 * Default maxLength for most F5 XC resources.
 * Some resources (like service_policy) have shorter limits - use
 * sync-api-constraints.ts to verify actual API limits.
 */
export const DEFAULT_NAME_MAX_LENGTH = 63;

/**
 * Common metadata fields shared across all API security resources.
 *
 * IMPORTANT: These are DEFAULT constraints. Resource-specific definitions
 * may override these values based on actual API constraints discovered
 * via the sync-api-constraints.ts tool.
 */
export const API_SECURITY_METADATA_FIELDS: FieldDefinition[] = [
  {
    name: 'name',
    label: 'Name',
    infoIconSelector: 'label:has(generic:text("Name")) button',
    inputSelector: 'textbox[name="Name"]',
    type: 'string',
    required: true,
    advanced: false,
    minLength: 1,
    maxLength: DEFAULT_NAME_MAX_LENGTH, // DNS-1035 default; may be overridden per-resource
    pattern: DNS_1035_PATTERN,
    patternDescription: DNS_1035_PATTERN_DESCRIPTION,
  },
  {
    name: 'labels',
    label: 'Labels',
    infoIconSelector: 'label:has(generic:text("Labels")) button',
    inputSelector: 'link:text("Add Label")',
    type: 'object',
    required: false,
    advanced: false,
    placeholder: 'Add Label',
  },
  {
    name: 'description',
    label: 'Description',
    infoIconSelector: 'label:has(generic:text("Description")) button',
    inputSelector: 'textbox[name="Description"]',
    type: 'string',
    required: false,
    advanced: false,
    // No maxLength - API accepts 1000+ chars
  },
];

/**
 * Common tooltip descriptions for metadata fields
 */
export const API_SECURITY_METADATA_TOOLTIPS: Record<string, string> = {
  name: 'The configuration object will be created with name. It has to be unique within the namespace.\nThe value of name has to follow DNS-1035 format.',
  labels:
    'Map of string keys and values that can be used to organize and categorize\n(scope and select) objects as chosen by the user. Values specified here will be used\nby selector expression',
  description: 'Human readable description for the object',
};

/**
 * Namespace selector field - used in resources that reference other namespaces
 */
export const NAMESPACE_SELECTOR_FIELD: FieldDefinition = {
  name: 'namespace',
  label: 'Namespace',
  infoIconSelector: 'label:has(generic:text("Namespace")) button',
  inputSelector: 'listbox[name="Namespace"]',
  type: 'string',
  required: false,
  advanced: false,
};

/**
 * Common reference selector field pattern
 * Used for selecting related resources (e.g., selecting an API Definition)
 */
export function createRefSelectorField(
  name: string,
  label: string,
  resourceType: string
): FieldDefinition {
  return {
    name,
    label,
    infoIconSelector: `label:has(generic:text("${label}")) button`,
    inputSelector: `listbox[name="${label}"]`,
    type: 'string',
    required: false,
    advanced: false,
    apiNote: `Reference to ${resourceType} resource`,
  };
}

/**
 * Common toggle/switch field pattern
 */
export function createToggleField(
  name: string,
  label: string,
  defaultValue: boolean = false
): FieldDefinition {
  return {
    name,
    label,
    infoIconSelector: `label:has(generic:text("${label}")) button`,
    inputSelector: `checkbox[name="${label}"]`,
    type: 'boolean',
    required: false,
    advanced: false,
    defaultValue,
  };
}

/**
 * Common dropdown/select field pattern
 */
export function createSelectField(
  name: string,
  label: string,
  enumValues: string[],
  defaultValue?: string,
  enumDescriptions?: Record<string, string>
): FieldDefinition {
  return {
    name,
    label,
    infoIconSelector: `label:has(generic:text("${label}")) button`,
    inputSelector: `listbox[name="${label}"]`,
    type: 'string',
    required: false,
    advanced: false,
    enum: enumValues,
    defaultValue,
    enumDescriptions,
  };
}
