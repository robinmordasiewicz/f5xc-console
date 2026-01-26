// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Service Policy Resource Definition
 *
 * Declarative definition for F5 XC service_policy resource.
 * Used by PropertyBuilder to generate JSON Schema with tooltips,
 * defaults, and nested configurations.
 *
 * Structure discovered via browser automation of F5 XC Console UI:
 * - Metadata section: Name, Labels, Description
 * - Servers section: Server Selection discriminator
 * - Rules section: Select Policy Rules discriminator
 *
 * When "Custom Rule List" is selected, rules become an array with 7 sections:
 * - Metadata: Name, Description
 * - Action: Deny/Allow/Next Policy discriminator
 * - Clients: Client Selection discriminator with nested fields
 * - Servers: Domain Matcher (Exact Values, Regex Values)
 * - Request Match: HTTP Method, Invert Matcher, HTTP Path, Query Params, Headers
 * - Request Constraints: Configure link for constraints
 * - Advanced Match: Keys, API Group, Source Segments, User Identity
 *
 * Discovery script: scripts/discover-service-policy.ts
 */

import { ResourceDefinition } from '../extractors/resource-definition';

/**
 * Service policy resource definition
 */
export const servicePolicyDefinition: ResourceDefinition = {
  resourceType: 'service_policy',
  title: 'F5 XC Service Policy Configuration',
  description: 'JSON Schema for F5 Distributed Cloud service_policy resource with UI tooltips, defaults, and nested configurations',
  version: '2.2.0', // Updated: Live API verification (2026-01-25) - name.maxLength=63 (DNS-1035), description no max limit
  formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/service_policies',

  // Top-level fields (Metadata section)
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'metadata.name',
      apiNote: 'Live API verification (2026-01-25): DNS-1035 label limit enforced at 63 chars',
      minLength: 0,
      maxLength: 16, // Live API test: "Exceeds max length of DNS-1035 label(63)"
      pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
      patternDescription: 'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with letter or number',
    },
    {
      name: 'labels',
      label: 'Labels',
      type: 'object',
      required: false,
      advanced: false,
      placeholder: 'Add Label',
      apiProperty: 'metadata.labels',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'string',
      required: false,
      advanced: false,
      apiProperty: 'metadata.description',
      apiNote: 'Live API verification (2026-01-25): 1000 char description accepted, no practical max limit enforced',
      // maxLength removed - API accepts 1000+ chars without constraint
    },
    // Servers section - Server Selection discriminator
    {
      name: 'server_selection',
      label: 'Server Selection',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'Any Server',
      enum: ['Any Server', 'Server Name', 'Group of Servers by Name'],
      enumDescriptions: {
        'Any Server': 'Apply policy to any server (default behavior).',
        'Server Name': 'Apply policy to a specific server by name.',
        'Group of Servers by Name': 'Apply policy to servers matching exact values or regex patterns.',
      },
      apiProperty: 'spec.server_choice',
    },
    // Rules section - Select Policy Rules discriminator
    {
      name: 'select_policy_rules',
      label: 'Select Policy Rules',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'Custom Rule List',
      enum: ['Custom Rule List', 'Allowed Sources', 'Denied Sources', 'Allow All Requests', 'Deny All Requests'],
      enumDescriptions: {
        'Custom Rule List': 'Configure a custom list of policy rules with detailed matching and action configurations.',
        'Allowed Sources': 'Allow requests from specified source IP prefixes.',
        'Denied Sources': 'Deny requests from specified source IP prefixes.',
        'Allow All Requests': 'Allow all requests without any restrictions.',
        'Deny All Requests': 'Deny all requests (block everything).',
      },
      apiProperty: 'spec.rule_choice',
    },
  ],

  // Nested configurations triggered by discriminators
  nestedConfigs: [
    // Server Name nested config (when server_selection = 'Server Name')
    {
      name: 'server_name_config',
      trigger: 'server_selection',
      triggerValue: 'Server Name',
      description: 'Specify a single server name to apply the policy to.',
      fields: [
        {
          name: 'server_name',
          label: 'Server Name',
          type: 'string',
          required: true,
          advanced: false,
          placeholder: 'example-server',
          apiProperty: 'spec.server_name',
          minLength: 0,
          maxLength: 253,
        },
      ],
    },
    // Group of Servers nested config (when server_selection = 'Group of Servers by Name')
    {
      name: 'server_group_config',
      trigger: 'server_selection',
      triggerValue: 'Group of Servers by Name',
      description: 'Specify server names using exact values and/or regex patterns.',
      fields: [
        {
          name: 'server_exact_values',
          label: 'Exact Values',
          type: 'array',
          required: false,
          advanced: false,
          placeholder: 'Add exact server name',
          apiProperty: 'spec.server_selector.exact_values',
        },
        {
          name: 'server_regex_values',
          label: 'Regex Values',
          type: 'array',
          required: false,
          advanced: false,
          placeholder: 'Add regex pattern',
          apiProperty: 'spec.server_selector.regex_values',
        },
      ],
    },
    // Allowed Sources nested config
    {
      name: 'allowed_sources_config',
      trigger: 'select_policy_rules',
      triggerValue: 'Allowed Sources',
      description: 'Allow requests from specified source IP prefixes.',
      fields: [
        {
          name: 'allowed_source_prefixes',
          label: 'Source IP Prefixes',
          type: 'array',
          required: true,
          advanced: false,
          placeholder: 'Add IP prefix (e.g., 10.0.0.0/8)',
          apiProperty: 'spec.allow_list.prefixes',
        },
      ],
    },
    // Denied Sources nested config
    {
      name: 'denied_sources_config',
      trigger: 'select_policy_rules',
      triggerValue: 'Denied Sources',
      description: 'Deny requests from specified source IP prefixes.',
      fields: [
        {
          name: 'denied_source_prefixes',
          label: 'Source IP Prefixes',
          type: 'array',
          required: true,
          advanced: false,
          placeholder: 'Add IP prefix (e.g., 192.168.0.0/16)',
          apiProperty: 'spec.deny_list.prefixes',
        },
      ],
    },
  ],

  // Array fields - Custom Rule List (when select_policy_rules = 'Custom Rule List')
  arrayFields: [
    {
      name: 'rules',
      description: 'List of custom policy rules. Rules are evaluated in order.',
      minItems: 1,
      maxItems: 256,
      addButtonLabel: 'Add Item',
      itemDiscriminator: 'action',
      apiProperty: 'spec.rules',
      conditionalOn: { field: 'select_policy_rules', value: 'Custom Rule List' },
      itemTypes: {
        'Deny': {
          description: 'Deny the request.',
          fields: [
            // ============================================
            // SECTION 1: Metadata
            // ============================================
            {
              name: 'name',
              label: 'Name',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'spec.rules[].metadata.name',
              minLength: 0,
              maxLength: 16, // DNS-1035 label limit verified via live API (2026-01-25)
              pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
              patternDescription: 'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with letter or number',
            },
            {
              name: 'rule_description',
              label: 'Description',
              type: 'string',
              required: false,
              advanced: false,
              apiProperty: 'spec.rules[].metadata.description',
              maxLength: 256,
            },

            // ============================================
            // SECTION 2: Clients
            // ============================================
            {
              name: 'client_selection',
              label: 'Client Selection',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'Any Client',
              enum: ['Any Client', 'Client Name', 'Group of Clients by Name', 'List of IP Threat Categories', 'Group of Clients by Label Selector'],
              enumDescriptions: {
                'Any Client': 'Match any client (default behavior).',
                'Client Name': 'The expected name of the client invoking the request API. The predicate evaluates to true if any of the actual names is the same as the expected client name.',
                'Group of Clients by Name': 'A list of exact values and/or regular expressions for the expected name of the client.',
                'List of IP Threat Categories': 'IP threat categories to choose from.',
                'Group of Clients by Label Selector': 'Match clients by Kubernetes-style label selector.',
              },
              apiProperty: 'spec.rules[].spec.client_choice',
            },
            // Client Name (when client_selection = 'Client Name')
            {
              name: 'client_name',
              label: 'Client Name',
              type: 'string',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Client Name' },
              placeholder: 'client-name',
              apiProperty: 'spec.rules[].spec.client_name',
              minLength: 0,
              maxLength: 253,
            },
            // Group of Clients by Name (when client_selection = 'Group of Clients by Name')
            {
              name: 'client_name_exact_values',
              label: 'Client Name Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Group of Clients by Name' },
              placeholder: 'Add exact client name',
              apiProperty: 'spec.rules[].spec.client_selector.exact_values',
            },
            {
              name: 'client_name_regex_values',
              label: 'Client Name Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Group of Clients by Name' },
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.client_selector.regex_values',
            },
            // IP Threat Categories (when client_selection = 'List of IP Threat Categories')
            {
              name: 'ip_threat_categories',
              label: 'IP Threat Categories',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'List of IP Threat Categories' },
              placeholder: 'Select threat categories',
              apiProperty: 'spec.rules[].spec.ip_threat_categories',
            },

            // ============================================
            // SECTION 3: Servers (Domain Matcher)
            // ============================================
            {
              name: 'domain_exact_values',
              label: 'Domain Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add exact domain',
              apiProperty: 'spec.rules[].spec.server_selector.exact_values',
            },
            {
              name: 'domain_regex_values',
              label: 'Domain Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.server_selector.regex_values',
            },

            // ============================================
            // SECTION 4: Request Match
            // ============================================
            {
              name: 'http_method',
              label: 'HTTP Method',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'ANY',
              enum: ['ANY', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'],
              apiProperty: 'spec.rules[].spec.http_method',
            },
            {
              name: 'invert_method_matcher',
              label: 'Invert Method Matcher',
              type: 'boolean',
              required: false,
              advanced: false,
              defaultValue: false,
              apiProperty: 'spec.rules[].spec.invert_method_matcher',
            },
            {
              name: 'path_match_type',
              label: 'Path Match Type',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'Any Path',
              enum: ['Any Path', 'Prefix', 'Path', 'Regex'],
              enumDescriptions: {
                'Any Path': 'Match any path.',
                'Prefix': 'Match paths starting with the specified prefix.',
                'Path': 'Match exact path.',
                'Regex': 'Match paths using regular expression.',
              },
              apiProperty: 'spec.rules[].spec.path.type',
            },
            {
              name: 'path_value',
              label: 'Path Value',
              type: 'string',
              required: false,
              advanced: false,
              conditionalOn: { field: 'path_match_type', value: ['Prefix', 'Path', 'Regex'] },
              placeholder: '/api/v1/*',
              apiProperty: 'spec.rules[].spec.path.value',
              maxLength: 2048,
            },
            {
              name: 'query_parameters',
              label: 'HTTP Query Parameters',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add query parameter match',
              apiProperty: 'spec.rules[].spec.query_params',
            },
            {
              name: 'headers',
              label: 'HTTP Headers',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add header match',
              apiProperty: 'spec.rules[].spec.headers',
            },

            // ============================================
            // SECTION 5: Advanced Match
            // ============================================
            {
              name: 'keys',
              label: 'Keys',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add key',
              apiProperty: 'spec.rules[].spec.keys',
            },
            {
              name: 'api_group_matcher',
              label: 'API Group Matcher',
              type: 'string',
              required: false,
              advanced: true,
              apiProperty: 'spec.rules[].spec.api_group_matcher',
            },
            {
              name: 'source_segments',
              label: 'Source Segments',
              type: 'string',
              required: false,
              advanced: true,
              defaultValue: 'Any Segment',
              enum: ['Any Segment', 'Custom Segment List'],
              apiProperty: 'spec.rules[].spec.source_segments',
            },
            {
              name: 'user_identity_exact_values',
              label: 'User Identity Exact Values',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add exact user identity',
              apiProperty: 'spec.rules[].spec.user_identity.exact_values',
            },
            {
              name: 'user_identity_regex_values',
              label: 'User Identity Regex Values',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.user_identity.regex_values',
            },
          ],
          requiredFields: ['name'],
        },
        'Allow': {
          description: 'Allow the request to proceed.',
          fields: [
            // ============================================
            // SECTION 1: Metadata
            // ============================================
            {
              name: 'name',
              label: 'Name',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'spec.rules[].metadata.name',
              minLength: 0,
              maxLength: 16, // DNS-1035 label limit verified via live API (2026-01-25)
              pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
              patternDescription: 'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with letter or number',
            },
            {
              name: 'rule_description',
              label: 'Description',
              type: 'string',
              required: false,
              advanced: false,
              apiProperty: 'spec.rules[].metadata.description',
              maxLength: 256,
            },

            // ============================================
            // SECTION 2: Clients
            // ============================================
            {
              name: 'client_selection',
              label: 'Client Selection',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'Any Client',
              enum: ['Any Client', 'Client Name', 'Group of Clients by Name', 'List of IP Threat Categories', 'Group of Clients by Label Selector'],
              enumDescriptions: {
                'Any Client': 'Match any client (default behavior).',
                'Client Name': 'The expected name of the client invoking the request API. The predicate evaluates to true if any of the actual names is the same as the expected client name.',
                'Group of Clients by Name': 'A list of exact values and/or regular expressions for the expected name of the client.',
                'List of IP Threat Categories': 'IP threat categories to choose from.',
                'Group of Clients by Label Selector': 'Match clients by Kubernetes-style label selector.',
              },
              apiProperty: 'spec.rules[].spec.client_choice',
            },
            {
              name: 'client_name',
              label: 'Client Name',
              type: 'string',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Client Name' },
              placeholder: 'client-name',
              apiProperty: 'spec.rules[].spec.client_name',
              minLength: 0,
              maxLength: 253,
            },
            {
              name: 'client_name_exact_values',
              label: 'Client Name Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Group of Clients by Name' },
              placeholder: 'Add exact client name',
              apiProperty: 'spec.rules[].spec.client_selector.exact_values',
            },
            {
              name: 'client_name_regex_values',
              label: 'Client Name Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Group of Clients by Name' },
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.client_selector.regex_values',
            },
            {
              name: 'ip_threat_categories',
              label: 'IP Threat Categories',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'List of IP Threat Categories' },
              placeholder: 'Select threat categories',
              apiProperty: 'spec.rules[].spec.ip_threat_categories',
            },

            // ============================================
            // SECTION 3: Servers (Domain Matcher)
            // ============================================
            {
              name: 'domain_exact_values',
              label: 'Domain Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add exact domain',
              apiProperty: 'spec.rules[].spec.server_selector.exact_values',
            },
            {
              name: 'domain_regex_values',
              label: 'Domain Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.server_selector.regex_values',
            },

            // ============================================
            // SECTION 4: Request Match
            // ============================================
            {
              name: 'http_method',
              label: 'HTTP Method',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'ANY',
              enum: ['ANY', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'],
              apiProperty: 'spec.rules[].spec.http_method',
            },
            {
              name: 'invert_method_matcher',
              label: 'Invert Method Matcher',
              type: 'boolean',
              required: false,
              advanced: false,
              defaultValue: false,
              apiProperty: 'spec.rules[].spec.invert_method_matcher',
            },
            {
              name: 'path_match_type',
              label: 'Path Match Type',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'Any Path',
              enum: ['Any Path', 'Prefix', 'Path', 'Regex'],
              enumDescriptions: {
                'Any Path': 'Match any path.',
                'Prefix': 'Match paths starting with the specified prefix.',
                'Path': 'Match exact path.',
                'Regex': 'Match paths using regular expression.',
              },
              apiProperty: 'spec.rules[].spec.path.type',
            },
            {
              name: 'path_value',
              label: 'Path Value',
              type: 'string',
              required: false,
              advanced: false,
              conditionalOn: { field: 'path_match_type', value: ['Prefix', 'Path', 'Regex'] },
              placeholder: '/api/v1/*',
              apiProperty: 'spec.rules[].spec.path.value',
              maxLength: 2048,
            },
            {
              name: 'query_parameters',
              label: 'HTTP Query Parameters',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add query parameter match',
              apiProperty: 'spec.rules[].spec.query_params',
            },
            {
              name: 'headers',
              label: 'HTTP Headers',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add header match',
              apiProperty: 'spec.rules[].spec.headers',
            },

            // ============================================
            // SECTION 5: Advanced Match
            // ============================================
            {
              name: 'keys',
              label: 'Keys',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add key',
              apiProperty: 'spec.rules[].spec.keys',
            },
            {
              name: 'api_group_matcher',
              label: 'API Group Matcher',
              type: 'string',
              required: false,
              advanced: true,
              apiProperty: 'spec.rules[].spec.api_group_matcher',
            },
            {
              name: 'source_segments',
              label: 'Source Segments',
              type: 'string',
              required: false,
              advanced: true,
              defaultValue: 'Any Segment',
              enum: ['Any Segment', 'Custom Segment List'],
              apiProperty: 'spec.rules[].spec.source_segments',
            },
            {
              name: 'user_identity_exact_values',
              label: 'User Identity Exact Values',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add exact user identity',
              apiProperty: 'spec.rules[].spec.user_identity.exact_values',
            },
            {
              name: 'user_identity_regex_values',
              label: 'User Identity Regex Values',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.user_identity.regex_values',
            },
          ],
          requiredFields: ['name'],
        },
        'Next Policy': {
          description: 'Terminate evaluation of the current policy and begin evaluating the next policy in the policy set. Note that the evaluation of any remaining rules in the current policy is skipped.',
          fields: [
            // ============================================
            // SECTION 1: Metadata
            // ============================================
            {
              name: 'name',
              label: 'Name',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'spec.rules[].metadata.name',
              minLength: 0,
              maxLength: 16, // DNS-1035 label limit verified via live API (2026-01-25)
              pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
              patternDescription: 'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with letter or number',
            },
            {
              name: 'rule_description',
              label: 'Description',
              type: 'string',
              required: false,
              advanced: false,
              apiProperty: 'spec.rules[].metadata.description',
              maxLength: 256,
            },

            // ============================================
            // SECTION 2: Clients
            // ============================================
            {
              name: 'client_selection',
              label: 'Client Selection',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'Any Client',
              enum: ['Any Client', 'Client Name', 'Group of Clients by Name', 'List of IP Threat Categories', 'Group of Clients by Label Selector'],
              enumDescriptions: {
                'Any Client': 'Match any client (default behavior).',
                'Client Name': 'The expected name of the client invoking the request API. The predicate evaluates to true if any of the actual names is the same as the expected client name.',
                'Group of Clients by Name': 'A list of exact values and/or regular expressions for the expected name of the client.',
                'List of IP Threat Categories': 'IP threat categories to choose from.',
                'Group of Clients by Label Selector': 'Match clients by Kubernetes-style label selector.',
              },
              apiProperty: 'spec.rules[].spec.client_choice',
            },
            {
              name: 'client_name',
              label: 'Client Name',
              type: 'string',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Client Name' },
              placeholder: 'client-name',
              apiProperty: 'spec.rules[].spec.client_name',
              minLength: 0,
              maxLength: 253,
            },
            {
              name: 'client_name_exact_values',
              label: 'Client Name Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Group of Clients by Name' },
              placeholder: 'Add exact client name',
              apiProperty: 'spec.rules[].spec.client_selector.exact_values',
            },
            {
              name: 'client_name_regex_values',
              label: 'Client Name Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'Group of Clients by Name' },
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.client_selector.regex_values',
            },
            {
              name: 'ip_threat_categories',
              label: 'IP Threat Categories',
              type: 'array',
              required: false,
              advanced: false,
              conditionalOn: { field: 'client_selection', value: 'List of IP Threat Categories' },
              placeholder: 'Select threat categories',
              apiProperty: 'spec.rules[].spec.ip_threat_categories',
            },

            // ============================================
            // SECTION 3: Servers (Domain Matcher)
            // ============================================
            {
              name: 'domain_exact_values',
              label: 'Domain Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add exact domain',
              apiProperty: 'spec.rules[].spec.server_selector.exact_values',
            },
            {
              name: 'domain_regex_values',
              label: 'Domain Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.server_selector.regex_values',
            },

            // ============================================
            // SECTION 4: Request Match
            // ============================================
            {
              name: 'http_method',
              label: 'HTTP Method',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'ANY',
              enum: ['ANY', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'],
              apiProperty: 'spec.rules[].spec.http_method',
            },
            {
              name: 'invert_method_matcher',
              label: 'Invert Method Matcher',
              type: 'boolean',
              required: false,
              advanced: false,
              defaultValue: false,
              apiProperty: 'spec.rules[].spec.invert_method_matcher',
            },
            {
              name: 'path_match_type',
              label: 'Path Match Type',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'Any Path',
              enum: ['Any Path', 'Prefix', 'Path', 'Regex'],
              enumDescriptions: {
                'Any Path': 'Match any path.',
                'Prefix': 'Match paths starting with the specified prefix.',
                'Path': 'Match exact path.',
                'Regex': 'Match paths using regular expression.',
              },
              apiProperty: 'spec.rules[].spec.path.type',
            },
            {
              name: 'path_value',
              label: 'Path Value',
              type: 'string',
              required: false,
              advanced: false,
              conditionalOn: { field: 'path_match_type', value: ['Prefix', 'Path', 'Regex'] },
              placeholder: '/api/v1/*',
              apiProperty: 'spec.rules[].spec.path.value',
              maxLength: 2048,
            },
            {
              name: 'query_parameters',
              label: 'HTTP Query Parameters',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add query parameter match',
              apiProperty: 'spec.rules[].spec.query_params',
            },
            {
              name: 'headers',
              label: 'HTTP Headers',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add header match',
              apiProperty: 'spec.rules[].spec.headers',
            },

            // ============================================
            // SECTION 5: Advanced Match
            // ============================================
            {
              name: 'keys',
              label: 'Keys',
              type: 'array',
              required: false,
              advanced: false,
              placeholder: 'Add key',
              apiProperty: 'spec.rules[].spec.keys',
            },
            {
              name: 'api_group_matcher',
              label: 'API Group Matcher',
              type: 'string',
              required: false,
              advanced: true,
              apiProperty: 'spec.rules[].spec.api_group_matcher',
            },
            {
              name: 'source_segments',
              label: 'Source Segments',
              type: 'string',
              required: false,
              advanced: true,
              defaultValue: 'Any Segment',
              enum: ['Any Segment', 'Custom Segment List'],
              apiProperty: 'spec.rules[].spec.source_segments',
            },
            {
              name: 'user_identity_exact_values',
              label: 'User Identity Exact Values',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add exact user identity',
              apiProperty: 'spec.rules[].spec.user_identity.exact_values',
            },
            {
              name: 'user_identity_regex_values',
              label: 'User Identity Regex Values',
              type: 'array',
              required: false,
              advanced: true,
              placeholder: 'Add regex pattern',
              apiProperty: 'spec.rules[].spec.user_identity.regex_values',
            },
          ],
          requiredFields: ['name'],
        },
      },
    },
  ],

  // Section-level tooltips
  sectionTooltips: {
    metadata: 'Common attributes that can be set during create for all configuration objects like name, labels etc.',
    servers: 'Server selection determines which servers this policy applies to.',
    rules: 'Policy rules define conditions and actions for request handling.',
  },

  // Tooltip data for F5 XC Console UI (captured from browser exploration)
  tooltipData: {
    // ============================================
    // Top-level fields (Metadata section)
    // ============================================
    name: 'The configuration object will be created with name. It has to be unique within the namespace.\nThe value of name has to follow DNS-1035 format.',
    labels: 'Map of string keys and values that can be used to organize and categorize\n(scope and select) objects as chosen by the user.',
    description: 'Human readable description for the object.',

    // ============================================
    // Server Selection section
    // ============================================
    server_selection: 'Select which servers this policy applies to.\nAny Server matches all servers, or specify specific servers by name or pattern.',
    server_name: 'Name of the specific server this policy applies to.',
    server_exact_values: 'List of exact server names to match.',
    server_regex_values: 'List of regex patterns to match server names.',

    // ============================================
    // Select Policy Rules section
    // ============================================
    select_policy_rules: 'Choose the type of policy rules to apply.\nCustom Rule List allows detailed rule configuration, or use predefined allow/deny behaviors.',
    allowed_source_prefixes: 'IP prefixes (CIDR notation) from which requests are allowed.',
    denied_source_prefixes: 'IP prefixes (CIDR notation) from which requests are denied.',

    // ============================================
    // Rules array
    // ============================================
    rules: 'List of custom policy rules. Rules are evaluated in order.\nFirst matching rule determines the action.',

    // ============================================
    // Rule Item - Action section
    // ============================================
    action: 'Action to take when this rule matches.\nDeny blocks the request, Allow permits it, Next Policy passes to the next policy.',
    rule_description: 'Human readable description for this rule.',

    // ============================================
    // Rule Item - Clients section
    // ============================================
    client_selection: 'Select which clients this rule applies to.\nAny Client matches all clients, or specify by name, label, or threat category.',
    client_name: 'The expected name of the client invoking the request API. The predicate evaluates to true if any of the actual names is the same as the expected client name.',
    client_name_exact_values: 'List of exact client names to match.',
    client_name_regex_values: 'List of regex patterns to match client names.',
    ip_threat_categories: 'IP threat categories to match against client IP addresses.',

    // ============================================
    // Rule Item - Servers (Domain Matcher) section
    // ============================================
    domain_exact_values: 'List of exact domain names to match.',
    domain_regex_values: 'List of regex patterns to match domain names.',

    // ============================================
    // Rule Item - Request Match section
    // ============================================
    http_method: 'HTTP method to match. ANY matches all methods.',
    invert_method_matcher: 'Invert the HTTP method matcher. When enabled, the rule matches all methods except the selected one.',
    path_match_type: 'Type of path matching to use.\nPrefix matches paths starting with value, Path matches exact path, Regex uses regular expression.',
    path_value: 'Path value to match (prefix, exact, or regex pattern depending on match type).',
    query_parameters: 'HTTP query parameters to match.',
    headers: 'HTTP headers to match.',

    // ============================================
    // Rule Item - Advanced Match section
    // ============================================
    keys: 'Keys for advanced matching criteria.',
    api_group_matcher: 'API group to match for API discovery integration.',
    source_segments: 'Source segments to match. Any Segment matches all segments, or specify a custom segment list.',
    user_identity_exact_values: 'List of exact user identity values to match.',
    user_identity_regex_values: 'List of regex patterns to match user identities.',
  },

  // Enum descriptions for discriminator fields
  enumDescriptions: {
    action: {
      'Deny': 'Deny the request.',
      'Allow': 'Allow the request to proceed.',
      'Next Policy': 'Terminate evaluation of the current policy and begin evaluating the next policy in the policy set. Note that the evaluation of any remaining rules in the current policy is skipped.',
    },
    client_selection: {
      'Any Client': 'Match any client (default behavior).',
      'Client Name': 'The expected name of the client invoking the request API.',
      'Group of Clients by Name': 'A list of exact values and/or regular expressions for the expected name of the client.',
      'List of IP Threat Categories': 'IP threat categories to choose from.',
      'Group of Clients by Label Selector': 'Match clients by Kubernetes-style label selector.',
    },
    server_selection: {
      'Any Server': 'Apply policy to any server (default behavior).',
      'Server Name': 'Apply policy to a specific server by name.',
      'Group of Servers by Name': 'Apply policy to servers matching exact values or regex patterns.',
    },
    select_policy_rules: {
      'Custom Rule List': 'Configure a custom list of policy rules with detailed matching and action configurations.',
      'Allowed Sources': 'Allow requests from specified source IP prefixes.',
      'Denied Sources': 'Deny requests from specified source IP prefixes.',
      'Allow All Requests': 'Allow all requests without any restrictions.',
      'Deny All Requests': 'Deny all requests (block everything).',
    },
    path_match_type: {
      'Any Path': 'Match any path.',
      'Prefix': 'Match paths starting with the specified prefix.',
      'Path': 'Match exact path.',
      'Regex': 'Match paths using regular expression.',
    },
    source_segments: {
      'Any Segment': 'Match any source segment.',
      'Custom Segment List': 'Match specific source segments from a custom list.',
    },
  },
};
