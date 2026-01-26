// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Healthcheck Resource Definition
 *
 * Declarative definition for F5 XC healthcheck resource.
 * Used by PropertyBuilder to generate JSON Schema with tooltips,
 * defaults, and nested configurations.
 *
 * Data captured from live F5 XC Console via Claude in Chrome MCP (2026-01-23)
 */

import { ResourceDefinition } from '../extractors/resource-definition';

/**
 * Healthcheck resource definition
 */
export const healthcheckDefinition: ResourceDefinition = {
  resourceType: 'healthcheck',
  title: 'F5 XC Healthcheck Configuration',
  description: 'JSON Schema for F5 Distributed Cloud healthcheck resource with UI tooltips, defaults, and nested configurations',
  version: '2.3.0', // Updated: Resolved 7 validation discrepancies (2026-01-25) - removed description.maxLength, marked UI discriminators
  formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/load_balancers/health_checks',

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
      minLength: 0,
      maxLength: 63, // DNS-1035 label limit verified via live API (2026-01-25)
      pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
      patternDescription: 'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with letter or number',
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
      // No maxLength - API accepts 1000+ chars (verified 2026-01-25)
    },
    {
      name: 'health_check',
      label: 'Health Check',
      infoIconSelector: 'label:has(generic:text("Health Check"):not(:text("Parameters"))) button',
      inputSelector: 'listbox',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'HTTP HealthCheck',
      enum: ['HTTP HealthCheck', 'TCP HealthCheck', 'ICMP HealthCheck for UDP Loadbalancer'],
      enumDescriptions: {
        'HTTP HealthCheck': 'Specifies the following details for HTTP health check requests: 1. Host header 2. Path 3. Request headers to add 4. Request headers to remove',
        'TCP HealthCheck': 'Specifies send payload and expected response payload',
        'ICMP HealthCheck for UDP Loadbalancer': 'Specifies ICMP HealthCheck for UDP Loadbalancer',
      },
      uiOnly: true, // UI discriminator - maps to API oneOf blocks (http_health_check, tcp_health_check, udp_icmp_health_check)
    },
    {
      name: 'timeout',
      label: 'Timeout',
      infoIconSelector: 'label:has(generic:text("Timeout")) button',
      inputSelector: 'spinbutton[name="Timeout"]',
      type: 'number',
      required: true,
      advanced: false,
      defaultValue: 3,
      unit: 'seconds',
      apiProperty: 'spec.timeout',
      minimum: 1,
      maximum: 600, // API: ves.io.schema.rules.uint32.lte: 600
    },
    {
      name: 'interval',
      label: 'Interval',
      infoIconSelector: 'label:has(generic:text("Interval")) button',
      inputSelector: 'spinbutton[name="Interval"]',
      type: 'number',
      required: true,
      advanced: false,
      defaultValue: 15,
      unit: 'seconds',
      apiProperty: 'spec.interval',
      minimum: 1,
      maximum: 600, // API: ves.io.schema.rules.uint32.lte: 600
    },
    {
      name: 'unhealthy_threshold',
      label: 'Unhealthy Threshold',
      infoIconSelector: 'label:has(generic:text("Unhealthy Threshold")) button',
      inputSelector: 'spinbutton[name="Unhealthy Threshold"]',
      type: 'number',
      required: true,
      advanced: false,
      defaultValue: 1,
      apiProperty: 'spec.unhealthy_threshold',
      minimum: 1,
      maximum: 16, // API: ves.io.schema.rules.uint32.lte: 16
    },
    {
      name: 'healthy_threshold',
      label: 'Healthy Threshold',
      infoIconSelector: 'label:has(generic:text("Healthy Threshold")) button',
      inputSelector: 'spinbutton[name="Healthy Threshold"]',
      type: 'number',
      required: true,
      advanced: false,
      defaultValue: 3,
      apiProperty: 'spec.healthy_threshold',
      minimum: 1,
      maximum: 16, // API: ves.io.schema.rules.uint32.lte: 16
    },
    {
      name: 'jitter_percent',
      label: 'Jitter Percent',
      infoIconSelector: 'label:has(generic:text("Jitter Percent")) button',
      inputSelector: 'spinbutton[name="Jitter Percent"]',
      type: 'number',
      required: false,
      advanced: true,
      defaultValue: 30,
      unit: 'percent',
      apiProperty: 'spec.jitter_percent',
      apiNote: 'API validation: 0 or 10-50 (ves.io.schema.rules.uint32.ranges: "0,10-50")',
      minimum: 0,
      maximum: 50, // API: range is 0,10-50 (0 or 10-50)
    },
  ],

  // Nested configurations
  nestedConfigs: [
    {
      name: 'http_health_check_config',
      trigger: 'health_check',
      triggerValue: 'HTTP HealthCheck',
      apiBlock: 'spec.http_health_check',
      apiNote: 'API: spec.http_health_check block. Part of oneOf with tcp_health_check, udp_icmp_health_check',
      description: 'Specifies the following details for HTTP health check requests\n1. Host header\n2. Path\n3. Request headers to add\n4. Request headers to remove',
      actionSelectors: {
        edit: 'link:text("Edit Configuration")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'specify_host_header',
          label: 'Specify Host Header',
          apiProperty: 'spec.http_health_check',
          apiNote: 'API oneOf: use_origin_server_name (empty object) | host_header (string). UI "Origin Server Name" → API {use_origin_server_name: {}}, UI "Host Header Value" → API {host_header: "<value>"}',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Origin Server Name',
          enum: ['Origin Server Name', 'Host Header Value'],
          enumDescriptions: {
            'Origin Server Name': 'Use the origin server name.',
            'Host Header Value': 'The value of the host header.',
          },
          uiOnly: true, // UI discriminator - maps to API oneOf (use_origin_server_name vs host_header)
        },
        {
          name: 'host_header_value',
          label: 'Host Header Value',
          apiProperty: 'spec.http_health_check.host_header',
          type: 'string',
          required: false,
          advanced: false,
          conditionalOn: { field: 'specify_host_header', value: 'Host Header Value' },
          maxLength: 262, // API: ves.io.schema.rules.string.max_len: 262
          format: 'hostname',
        },
        {
          name: 'path',
          label: 'Path',
          apiProperty: 'spec.http_health_check.path',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: '/',
          minLength: 0,
          maxLength: 2048, // API: ves.io.schema.rules.string.max_len: 2048
          pattern: '^/.*',
          patternDescription: 'Must start with forward slash (/)',
        },
        {
          name: 'use_http2',
          label: 'Use HTTP2',
          apiProperty: 'spec.http_health_check.use_http2',
          type: 'boolean',
          required: false,
          advanced: false,
          defaultValue: false,
        },
        {
          name: 'request_headers_to_add',
          label: 'Request Headers to Add',
          apiProperty: 'spec.http_health_check.headers',
          apiNote: 'API uses "headers" as object/map (key-value pairs). Live API testing (2026-01-25) confirmed both array and object formats accepted at input, but stored as object map. Map validation: max_pairs: 16, keys min_len: 1, max_len: 256, values min_len: 1, max_len: 2048. Schema generator should produce: {type: "object", additionalProperties: {type: "string"}, maxProperties: 16}',
          type: 'object',
          required: false,
          advanced: false,
          defaultValue: {},
        },
        {
          name: 'request_headers_to_remove',
          label: 'Request Headers to Remove',
          apiProperty: 'spec.http_health_check.request_headers_to_remove',
          type: 'array',
          required: false,
          advanced: true,
          defaultValue: [],
          maxItems: 16, // API: ves.io.schema.rules.repeated.max_items: 16
          itemType: { type: 'string', maxLength: 256 },
        },
        {
          name: 'expected_status_codes',
          label: 'Expected Status Codes',
          apiProperty: 'spec.http_health_check.expected_status_codes',
          apiNote: 'Each item is single status code or range (e.g., "200" or "200-250")',
          type: 'array',
          required: false,
          advanced: false,
          defaultValue: ['200'],
          maxItems: 16, // API: ves.io.schema.rules.repeated.max_items: 16
          itemType: { type: 'string', minLength: 3, maxLength: 10 },
        },
      ],
    },
    {
      name: 'tcp_health_check_config',
      trigger: 'health_check',
      triggerValue: 'TCP HealthCheck',
      apiBlock: 'spec.tcp_health_check',
      apiNote: 'API: spec.tcp_health_check block. Part of oneOf with http_health_check, udp_icmp_health_check',
      description: 'Specifies send payload and expected response payload',
      actionSelectors: {
        edit: 'link:text("Edit Configuration")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'send_payload',
          label: 'Send Payload',
          apiProperty: 'spec.tcp_health_check.send_payload',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: '',
          maxLength: 2048, // API: ves.io.schema.rules.string.max_len: 2048
          pattern: '^([0-9a-fA-F]{2})*$',
          patternDescription: 'Hex-encoded bytes (pairs of hex characters)',
        },
        {
          name: 'expected_response',
          label: 'Expected Response',
          apiProperty: 'spec.tcp_health_check.expected_response', // API field name is expected_response
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: '',
          maxLength: 2048, // API: ves.io.schema.rules.string.max_len: 2048
          pattern: '^([0-9a-fA-F]{2})*$',
          patternDescription: 'Hex-encoded bytes (pairs of hex characters)',
        },
      ],
    },
  ],

  // Section-level tooltips
  sectionTooltips: {
    metadata: 'Common attributes that can be set during create for all configuration objects like name, labels etc.',
    http_healthcheck: 'Specifies the following details for HTTP health check requests\n1. Host header\n2. Path\n3. Request headers to add\n4. Request headers to remove',
    tcp_healthcheck: 'Specifies send payload and expected response payload',
    icmp_healthcheck: 'Specifies ICMP HealthCheck for UDP Loadbalancer',
  },

  // Tooltip data captured from F5 XC Console (extracted via browser automation)
  // This data is captured by hovering over info icons and reading [role="tooltip"] content
  // Last captured: 2026-01-23 via Claude in Chrome MCP
  tooltipData: {
    // Top-level fields
    name: 'The configuration object will be created with name. It has to be unique within the namespace.\nThe value of name has to follow DNS-1035 format.',
    labels: 'Map of string keys and values that can be used to organize and categorize\n(scope and select) objects as chosen by the user. Values specified here will be used\nby selector expression',
    description: 'Human readable description for the object',
    health_check: 'Specifies whether to perform HTTP Health Check or TCP Health check',
    timeout: 'Timeout in seconds to wait for successful response. In other words, it is\nthe time to wait for a health check response. If the timeout is reached the\nhealth check attempt will be considered a failure.',
    interval: 'Time interval in seconds between two healthcheck requests.',
    unhealthy_threshold: 'Number of failed responses before declaring unhealthy. In other words, this is\nthe number of unhealthy health checks required before a host is marked\nunhealthy. Note that for http health checking if a host responds with 503\nthis threshold is ignored and the host is considered unhealthy immediately.',
    healthy_threshold: 'Number of successful responses before declaring healthy. In other words, this is\nthe number of healthy health checks required before a host is marked\nhealthy. Note that during startup, only a single successful health check is\nrequired to mark a host healthy.',
    jitter_percent: 'Add a random amount of time as a percent value to the interval between successive healthcheck requests.',

    // HTTP HealthCheck nested fields
    specify_host_header: 'Specify the value of host header in the HTTP health check request.',
    host_header_value: 'The value of the host header.',
    path: 'Specifies the HTTP path that will be requested during health checking.',
    use_http2: 'If set, health checks will be made using http/2.',
    request_headers_to_add: 'Additional headers to include in health check requests.',
    request_headers_to_remove: 'Headers to remove from health check requests.',
    expected_status_codes: 'Expected HTTP status codes indicating a healthy response.',

    // TCP HealthCheck fields
    send_payload: 'Raw bytes sent in the request. Empty payloads imply a connect-only health check.\nDescribes the encoding of the payload bytes in the payload. Hex encoded payload.',
    expected_response: 'Raw bytes expected in the response. Describes the encoding of the payload bytes in the payload.\nHex encoded payload.',
  },

  // Top-level enum descriptions for discriminator fields
  enumDescriptions: {
    health_check: {
      'HTTP HealthCheck': 'Specifies the following details for HTTP health check requests: 1. Host header 2. Path 3. Request headers to add 4. Request headers to remove',
      'TCP HealthCheck': 'Specifies send payload and expected response payload',
      'ICMP HealthCheck for UDP Loadbalancer': 'Specifies ICMP HealthCheck for UDP Loadbalancer',
    },
    specify_host_header: {
      'Origin Server Name': 'Use the origin server name.',
      'Host Header Value': 'The value of the host header.',
    },
  },
};
