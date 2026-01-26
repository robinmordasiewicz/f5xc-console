// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Data Type Resource Definition
 *
 * Declarative definition for F5 XC Data Type resource.
 * Used by PropertyBuilder to generate JSON Schema with tooltips,
 * defaults, and nested configurations.
 *
 * Data captured from live F5 XC Console via Chrome DevTools MCP (2026-01-25)
 */

import { ResourceDefinition } from '../extractors/resource-definition';
import {
  API_SECURITY_METADATA_FIELDS,
  API_SECURITY_METADATA_TOOLTIPS,
} from './shared/api-security-common';

/**
 * Data Type resource definition
 */
export const dataTypeDefinition: ResourceDefinition = {
  resourceType: 'data_type',
  title: 'F5 XC Data Type Configuration',
  description:
    'JSON Schema for F5 Distributed Cloud Data Type resource with UI tooltips, defaults, and nested configurations',
  version: '1.0.0',
  formUrl:
    'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/api_security/data_type',

  // Top-level fields
  fields: [
    ...API_SECURITY_METADATA_FIELDS,
    {
      name: 'mark_as_sensitive_data',
      label: 'Mark as Sensitive Data',
      infoIconSelector: 'label:has(generic:text("Mark as Sensitive Data")) button',
      inputSelector: 'checkbox[name="Mark as Sensitive Data"]',
      type: 'boolean',
      required: false,
      advanced: false,
      defaultValue: true,
      apiProperty: 'spec.mark_as_sensitive_data',
      apiNote: 'Boolean flag indicating if data should be marked as sensitive',
    },
    {
      name: 'mark_as_pii',
      label: 'Mark as PII',
      infoIconSelector: 'label:has(generic:text("Mark as PII")) button',
      inputSelector: 'checkbox[name="Mark as PII"]',
      type: 'boolean',
      required: false,
      advanced: false,
      defaultValue: false,
      apiProperty: 'spec.mark_as_pii',
      apiNote: 'Boolean flag indicating if data is Personally Identifiable Information',
    },
    {
      name: 'relevant_compliances',
      label: 'Relevant Compliances',
      infoIconSelector: 'label:has(generic:text("Relevant Compliances")) button',
      inputSelector: 'listbox[name="Relevant Compliances"]',
      type: 'array',
      required: false,
      advanced: false,
      apiProperty: 'spec.relevant_compliances',
      apiNote: 'List of compliance standards this data type is relevant to',
      itemType: {
        type: 'string',
        enum: ['GDPR', 'PCI_DSS', 'CCPA'],
        enumDescriptions: {
          GDPR: 'General Data Protection Regulation - EU data protection law',
          PCI_DSS: 'Payment Card Industry Data Security Standard',
          CCPA: 'California Consumer Privacy Act',
        },
      },
    },
  ],

  // Nested configurations for Data Type Rules
  nestedConfigs: [
    {
      name: 'data_type_rules',
      trigger: 'data_type_rules',
      triggerValue: 'configured',
      apiBlock: 'spec.rules',
      apiNote: 'API: spec.rules array containing detection rule configurations',
      description:
        'Configure detection rules for identifying this data type. Each rule specifies how to search for and detect the data pattern.',
      actionSelectors: {
        edit: 'button:text("Add Item")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Cancel"))',
      },
      fields: [
        {
          name: 'pattern_choice',
          label: 'Pattern Choice',
          infoIconSelector: 'label:has(generic:text("Pattern Choice")) button',
          inputSelector: 'listbox[name="Pattern Choice"]',
          type: 'string',
          required: true,
          advanced: false,
          apiProperty: 'spec.rules[].pattern_choice',
          apiNote: 'Where to search for the pattern: key, value, or both',
          enum: ['KEY_PATTERN', 'VALUE_PATTERN', 'KEY_VALUE_PATTERN'],
          defaultValue: 'KEY_PATTERN',
          enumDescriptions: {
            KEY_PATTERN: 'Key Pattern - Search for the data type in the key only',
            VALUE_PATTERN: 'Value Pattern - Search for the data type in the value only',
            KEY_VALUE_PATTERN: 'Key Value Pattern - Search for the data type in both key and value',
          },
        },
        {
          name: 'pattern',
          label: 'Pattern',
          infoIconSelector: 'label:has(generic:text("Pattern")) button',
          inputSelector: 'listbox[name="Pattern"]',
          type: 'string',
          required: true,
          advanced: false,
          apiProperty: 'spec.rules[].pattern_type',
          apiNote: 'How to detect the pattern: regex, exact value, or substring',
          enum: ['REGEX_VALUE', 'EXACT_VALUE'],
          defaultValue: 'REGEX_VALUE',
          enumDescriptions: {
            REGEX_VALUE: 'Regex Value - Detect using a regular expression pattern',
            EXACT_VALUE: 'Exact Value - Detect using an exact string match',
          },
        },
        {
          name: 'regex_value',
          label: 'Regex Value',
          infoIconSelector: 'label:has(generic:text("Regex Value")) button',
          inputSelector: 'textbox[name="Regex Value"]',
          type: 'string',
          required: true,
          advanced: false,
          apiProperty: 'spec.rules[].regex_value',
          apiNote: 'Regular expression pattern for detection',
          conditionalOn: { field: 'pattern', value: 'REGEX_VALUE' },
        },
        {
          name: 'exact_value',
          label: 'Exact Value',
          infoIconSelector: 'label:has(generic:text("Exact Value")) button',
          inputSelector: 'textbox[name="Exact Value"]',
          type: 'string',
          required: true,
          advanced: false,
          apiProperty: 'spec.rules[].exact_value',
          apiNote: 'Exact string value for detection',
          conditionalOn: { field: 'pattern', value: 'EXACT_VALUE' },
        },
      ],
    },
  ],

  // Section-level tooltips
  sectionTooltips: {
    metadata:
      'Common attributes that can be set during create for all configuration objects like name, labels etc.',
    data_classification:
      'Configure data sensitivity and compliance settings for this data type',
    data_type_rules:
      'Define detection rules that specify how to identify this data type in API traffic',
  },

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    ...API_SECURITY_METADATA_TOOLTIPS,
    mark_as_sensitive_data:
      'Mark this data type as sensitive data. Sensitive data will be masked in logs and reports.',
    mark_as_pii:
      'Mark this data type as Personally Identifiable Information (PII). PII requires special handling under various compliance regulations.',
    relevant_compliances:
      'Select the compliance standards that this data type is relevant to (GDPR, PCI/DSS, CCPA).',
    pattern_choice:
      'Search the data type in the key, value or both',
    pattern:
      'How to detect the current rule. by regex/exact value or substring',
    regex_value:
      'Regular expression pattern to match against the selected target (key, value, or both)',
    exact_value:
      'Exact string value to match against the selected target (key, value, or both)',
  },

  // Enum descriptions for UI mapping
  enumDescriptions: {
    pattern_choice: {
      'Key Pattern': 'Search for the data type in the key only',
      'Value Pattern': 'Search for the data type in the value only',
      'Key Value Pattern': 'Search for the data type in both key and value',
    },
    pattern: {
      'Regex Value': 'Detect using a regular expression pattern',
      'Exact Value': 'Detect using an exact string match',
    },
    relevant_compliances: {
      'GDPR': 'General Data Protection Regulation',
      'PCI/DSS': 'Payment Card Industry Data Security Standard',
      'CCPA': 'California Consumer Privacy Act',
    },
  },
};
