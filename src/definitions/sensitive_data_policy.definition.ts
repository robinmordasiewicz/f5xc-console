// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Sensitive Data Policy Resource Definition
 *
 * Declarative definition for F5 XC Sensitive Data Discovery (sensitive_data_policy) resource.
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
 * Built-in sensitive data types available in F5 XC
 * These can be disabled in the sensitive data policy
 */
export const BUILT_IN_SENSITIVE_DATA_TYPES = [
  'order-details',
  'date-in-dd-mm-yyyy-format',
  'device-id',
  'date-of-birth',
  'postal-code',
  'uk-postal-code',
  'full-name',
  'salary-wage',
  'us-canadian-zip-postal-code',
  'state-province',
  'currency',
  'price',
  'time-in-24-hour-format',
] as const;

/**
 * Compliance frameworks supported by F5 XC
 */
export const COMPLIANCE_FRAMEWORKS = ['PCI-DSS', 'GDPR', 'HIPAA', 'CCPA'] as const;

/**
 * Sensitive Data Policy resource definition
 */
export const sensitiveDataPolicyDefinition: ResourceDefinition = {
  resourceType: 'sensitive_data_policy',
  title: 'F5 XC Sensitive Data Discovery Configuration',
  description:
    'JSON Schema for F5 Distributed Cloud Sensitive Data Discovery resource with UI tooltips, defaults, and nested configurations',
  version: '1.0.0',
  formUrl:
    'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/api_security/sensitive_data_policy',

  // Top-level fields
  fields: [
    ...API_SECURITY_METADATA_FIELDS,
    {
      name: 'compliance_frameworks',
      label: 'Compliance Frameworks',
      infoIconSelector: 'label:has(generic:text("Compliance Frameworks")) button',
      inputSelector: 'combobox[name="Compliance Frameworks"]',
      type: 'array',
      required: false,
      advanced: false,
      defaultValue: ['PCI-DSS'],
      apiProperty: 'spec.compliance_frameworks',
      apiNote: 'List of compliance frameworks to apply to this policy',
      itemType: {
        type: 'string',
        enum: [...COMPLIANCE_FRAMEWORKS],
        enumDescriptions: {
          'PCI-DSS': 'Payment Card Industry Data Security Standard',
          GDPR: 'General Data Protection Regulation (EU)',
          HIPAA: 'Health Insurance Portability and Accountability Act',
          CCPA: 'California Consumer Privacy Act',
        },
      },
    },
    {
      name: 'disabled_built_in_sensitive_data_types',
      label: 'Disabled Built-In Sensitive Data Types',
      infoIconSelector:
        'label:has(generic:text("Disabled Built-In Sensitive Data Types")) button',
      inputSelector: 'button:text("Add Item")',
      type: 'array',
      required: false,
      advanced: false,
      apiProperty: 'spec.disabled_built_in_rules',
      apiNote:
        'List of built-in sensitive data types to disable. These will not be detected.',
      itemType: {
        type: 'string',
        enum: [...BUILT_IN_SENSITIVE_DATA_TYPES],
        enumDescriptions: {
          'order-details': 'Order details and transaction information',
          'date-in-dd-mm-yyyy-format': 'Dates in DD-MM-YYYY format',
          'device-id': 'Device identifiers',
          'date-of-birth': 'Date of birth information',
          'postal-code': 'Postal/ZIP codes',
          'uk-postal-code': 'UK-specific postal codes',
          'full-name': 'Full person names',
          'salary-wage': 'Salary and wage information',
          'us-canadian-zip-postal-code': 'US and Canadian postal codes',
          'state-province': 'State or province names',
          currency: 'Currency values and codes',
          price: 'Price and monetary amounts',
          'time-in-24-hour-format': 'Time in 24-hour format',
        },
      },
    },
  ],

  // Nested configurations
  nestedConfigs: [
    {
      name: 'defined_custom_sensitive_data_types',
      trigger: 'defined_custom_sensitive_data_types',
      triggerValue: 'configured',
      apiBlock: 'spec.custom_sensitive_data_type',
      apiNote:
        'API: spec.custom_sensitive_data_type array containing references to custom data_type resources',
      description:
        'Configure custom sensitive data types to monitor. References custom data_type resources defined in the namespace.',
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'custom_data_types',
          label: 'Custom Data Types',
          apiProperty: 'spec.custom_sensitive_data_type',
          apiNote: 'Array of references to custom data_type resources',
          type: 'array',
          required: false,
          advanced: false,
          itemType: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                label: 'Name',
                description: 'Name of the custom data_type resource',
                required: true,
              },
              namespace: {
                type: 'string',
                label: 'Namespace',
                description: 'Namespace of the custom data_type resource',
                required: false,
              },
            },
          },
        },
      ],
    },
  ],

  // Section-level tooltips
  sectionTooltips: {
    metadata:
      'Common attributes that can be set during create for all configuration objects like name, labels etc.',
    compliance_frameworks:
      'Select relevant compliance frameworks that this sensitive data policy should align with',
    disabled_built_in_sensitive_data_types:
      'Select built-in sensitive data types to disable. Disabled types will not be detected by this policy.',
    defined_custom_sensitive_data_types:
      'Configure custom sensitive data types to monitor using data_type resources',
  },

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    ...API_SECURITY_METADATA_TOOLTIPS,
    compliance_frameworks:
      'Select relevant compliance frameworks, such as GDPR, HIPAA, or PCI-DSS, to ensure sensitive data handling meets regulatory requirements.',
    disabled_built_in_sensitive_data_types:
      'List of built-in sensitive data types to disable. These patterns will not be detected when analyzing API traffic.',
    defined_custom_sensitive_data_types:
      'List of custom data types to monitor. Reference custom data_type resources to define additional sensitive data patterns.',
  },

  // Enum descriptions for UI mapping
  enumDescriptions: {
    compliance_frameworks: {
      'PCI-DSS': 'Payment Card Industry Data Security Standard',
      GDPR: 'General Data Protection Regulation',
      HIPAA: 'Health Insurance Portability and Accountability Act',
      CCPA: 'California Consumer Privacy Act',
    },
    disabled_built_in_sensitive_data_types: {
      'order-details': 'Order and transaction details',
      'date-in-dd-mm-yyyy-format': 'Dates in DD-MM-YYYY format',
      'device-id': 'Device identifiers',
      'date-of-birth': 'Date of birth',
      'postal-code': 'Postal codes',
      'uk-postal-code': 'UK postal codes',
      'full-name': 'Full names',
      'salary-wage': 'Salary and wage data',
      'us-canadian-zip-postal-code': 'US/Canadian postal codes',
      'state-province': 'State or province',
      currency: 'Currency values',
      price: 'Price amounts',
      'time-in-24-hour-format': '24-hour time format',
    },
  },
};
