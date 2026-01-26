// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * API Discovery Resource Definition
 *
 * Declarative definition for F5 XC API Discovery resource.
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
 * API Discovery resource definition
 */
export const apiDiscoveryDefinition: ResourceDefinition = {
  resourceType: 'api_discovery',
  title: 'F5 XC API Discovery Configuration',
  description:
    'JSON Schema for F5 Distributed Cloud API Discovery resource with UI tooltips, defaults, and nested configurations',
  version: '1.0.0',
  formUrl:
    'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/api_security/api_discovery',

  // Top-level fields - only metadata for API Discovery
  fields: [...API_SECURITY_METADATA_FIELDS],

  // Nested configurations
  nestedConfigs: [
    {
      name: 'custom_authentication_types',
      trigger: 'custom_authentication_types',
      triggerValue: 'configured',
      apiBlock: 'spec.custom_auth_config',
      apiNote:
        'API: spec.custom_auth_config block containing custom_auth_type array',
      description:
        'Configure custom authentication types for API discovery. Each item specifies a parameter type (query, header, cookie) and parameter name.',
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'custom_auth_type',
          label: 'Custom Authentication Types',
          apiProperty: 'spec.custom_auth_config.custom_auth_type',
          apiNote:
            'Array of custom authentication type objects with location and name fields',
          type: 'array',
          required: false,
          advanced: false,
          itemType: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                label: 'Parameter Type',
                description:
                  'Where to look for the authentication parameter',
                enum: ['QUERY', 'HEADER', 'COOKIE'],
                enumDescriptions: {
                  QUERY: 'Query Parameter - Look for auth in URL query string',
                  HEADER: 'Header - Look for auth in HTTP request header',
                  COOKIE: 'Cookie - Look for auth in HTTP cookie',
                },
                required: true,
              },
              name: {
                type: 'string',
                label: 'Parameter Name',
                description: 'Name of the parameter containing authentication',
                minLength: 1,
                maxLength: 256,
                required: true,
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
    custom_authentication_types:
      'Configure custom authentication parameter types and names for API discovery. Supports query parameters, headers, and cookies.',
  },

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    ...API_SECURITY_METADATA_TOOLTIPS,
    custom_authentication_types:
      'Define custom authentication parameters that should be recognized during API discovery. Specify the parameter location (query, header, or cookie) and the parameter name.',
    parameter_type:
      'The location where the authentication parameter is passed. Options: Query Parameter (URL query string), Header (HTTP header), Cookie (HTTP cookie).',
    parameter_name:
      'The name of the parameter that contains authentication information.',
  },

  // Enum descriptions for UI mapping
  enumDescriptions: {
    parameter_type: {
      'Query Parameter':
        'Look for authentication in URL query string parameter',
      Header: 'Look for authentication in HTTP request header',
      Cookie: 'Look for authentication in HTTP cookie',
    },
  },
};
