// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * API Groups Resource Definition
 *
 * Declarative definition for F5 XC API Groups resource.
 * Used by PropertyBuilder to generate JSON Schema with tooltips,
 * defaults, and nested configurations.
 *
 * Data captured from live F5 XC Console via Chrome DevTools MCP (2026-01-25)
 */

import { ResourceDefinition } from '../extractors/resource-definition';
import {
  DNS_1035_PATTERN,
  DNS_1035_PATTERN_DESCRIPTION,
} from './shared/api-security-common';

/**
 * API Groups resource definition
 */
export const apiGroupsDefinition: ResourceDefinition = {
  resourceType: 'api_groups',
  title: 'F5 XC API Groups Configuration',
  description:
    'JSON Schema for F5 Distributed Cloud API Groups resource with UI tooltips, defaults, and nested configurations',
  version: '1.0.0',
  formUrl:
    'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/api_security/api_groups',

  // Top-level fields
  fields: [
    {
      name: 'name',
      label: 'Name',
      infoIconSelector: 'label:has(generic:text("Name")) button',
      inputSelector: 'textbox[name="Name"]',
      type: 'string',
      required: true,
      advanced: false,
      minLength: 1,
      maxLength: 63,
      pattern: DNS_1035_PATTERN,
      patternDescription: DNS_1035_PATTERN_DESCRIPTION,
    },
    {
      name: 'description',
      label: 'Description',
      infoIconSelector: 'label:has(generic:text("Description")) button',
      inputSelector: 'textbox[name="Description"]',
      type: 'string',
      required: false,
      advanced: false,
    },
    {
      name: 'scope',
      label: 'Scope',
      infoIconSelector: 'label:has(generic:text("Scope")) button',
      inputSelector: 'listbox[name="Scope"]',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'HTTP Load Balancer',
      enum: ['HTTP Load Balancer'],
      enumDescriptions: {
        'HTTP Load Balancer':
          'Select an HTTP Load Balancer to scope the API endpoints',
      },
      apiProperty: 'spec.elements',
      apiNote:
        'API: spec.elements array with items containing http_loadbalancer reference',
    },
    {
      name: 'http_load_balancer',
      label: 'HTTP Load Balancer',
      infoIconSelector:
        'label:has(generic:text("HTTP Load Balancer")) button',
      inputSelector: 'listbox[name="HTTP Load Balancer"]',
      type: 'string',
      required: true,
      advanced: false,
      conditionalOn: { field: 'scope', value: 'HTTP Load Balancer' },
      apiProperty: 'spec.elements[].http_loadbalancer',
      apiNote: 'Reference to HTTP Load Balancer resource (name and namespace)',
    },
  ],

  // No nested configurations - form is straightforward
  nestedConfigs: [],

  // Section-level tooltips
  sectionTooltips: {
    metadata:
      'Common attributes that can be set during create for all configuration objects like name, labels etc.',
    api_endpoints:
      'Configure the scope and target for grouping API endpoints',
  },

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    name: 'The configuration object will be created with name. It has to be unique within the namespace. The value of name has to follow DNS-1035 format.',
    description: 'Human readable description for the object',
    scope:
      'The API Endpoints list is generated based on the item that you have selected in the scope field.',
    http_load_balancer:
      'Select the HTTP Load Balancer to associate with this API group',
  },

  // Enum descriptions
  enumDescriptions: {
    scope: {
      'HTTP Load Balancer':
        'Group API endpoints from an HTTP Load Balancer',
    },
  },
};
