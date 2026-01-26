// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * API Definition Resource Definition
 *
 * Declarative definition for F5 XC API Definition resource.
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
 * API Definition resource definition
 */
export const apiDefinitionDefinition: ResourceDefinition = {
  resourceType: 'api_definition',
  title: 'F5 XC API Definition Configuration',
  description:
    'JSON Schema for F5 Distributed Cloud API Definition resource with UI tooltips, defaults, and nested configurations',
  version: '1.0.0',
  formUrl:
    'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/api_security/api_definition',

  // Top-level fields
  fields: [
    ...API_SECURITY_METADATA_FIELDS,
    {
      name: 'swagger_specs',
      label: 'OpenAPI Specification Files',
      infoIconSelector: 'label:has(generic:text("OpenAPI Specification Files")) button',
      inputSelector: 'button:text("Add Item")',
      type: 'array',
      required: false,
      advanced: false,
      apiProperty: 'spec.swagger_specs',
      apiNote: 'List of OpenAPI/Swagger specification file paths',
      itemType: {
        type: 'string',
        minLength: 1,
        maxLength: 1024,
      },
    },
  ],

  // Nested configurations
  nestedConfigs: [
    {
      name: 'api_inventory_inclusion_list',
      trigger: 'api_endpoints_management',
      triggerValue: 'configured',
      apiBlock: 'spec.api_inventory_inclusion_list',
      apiNote: 'API: spec.api_inventory_inclusion_list block for managing API endpoint inventory',
      description: 'Configure API inventory inclusion list for endpoint management',
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'api_groups',
          label: 'API Groups',
          apiProperty: 'spec.api_inventory_inclusion_list.api_groups',
          type: 'array',
          required: false,
          advanced: false,
          apiNote: 'List of API group references to include in inventory',
          itemType: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                label: 'Name',
                description: 'API group name reference',
              },
              namespace: {
                type: 'string',
                label: 'Namespace',
                description: 'Namespace of the API group',
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
    openapi_specification_files: 'OpenAPI/Swagger specification files that define the API schema',
    api_endpoints_management: 'Configuration for managing API endpoints and inventory',
  },

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    ...API_SECURITY_METADATA_TOOLTIPS,
    swagger_specs:
      'List of OpenAPI/Swagger specification files. These files define the API schema and endpoints.',
    api_inventory_inclusion_list:
      'Configure which API groups and endpoints should be included in the API inventory.',
  },

  // Enum descriptions
  enumDescriptions: {},
};
