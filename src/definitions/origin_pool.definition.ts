// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Origin Pool Resource Definition
 *
 * Declarative definition for F5 XC origin_pool resource.
 * Consolidates previously fragmented schema files (mvp, full, api variants).
 *
 * Features:
 * - Top-level fields with tooltips and defaults
 * - Nested TLS configuration (conditional on TLS enabled)
 * - Nested Ring Hash configuration (conditional on load balancer algorithm)
 * - Origin servers array with discriminated item types (triple nesting)
 * - Health check API reference field
 *
 * Source of truth for origin_pool schema generation.
 * Schema files are ephemeral and regenerated on-demand.
 */

import { ResourceDefinition, FieldDefinition } from '../extractors/resource-definition';

/**
 * Origin pool resource definition
 */
export const originPoolDefinition: ResourceDefinition = {
  resourceType: 'origin_pool',
  title: 'F5 XC Origin Pool Configuration',
  description: 'JSON Schema for F5 Distributed Cloud origin_pool resource with UI tooltips, defaults, and nested configurations',
  version: '3.1.0', // Updated: API-validated constraints from f5xc-api-specs-v2.0.46
  formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/load_balancers/origin_pools',

  // Top-level fields
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'metadata.name',
      minLength: 1,
      maxLength: 63, // DNS-1035 label limit verified via live API (2026-01-25)
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
      maxLength: 256,
    },
    {
      name: 'port',
      label: 'Port',
      type: 'number',
      required: true,
      advanced: false,
      defaultValue: 80,
      minimum: 1,
      maximum: 65535,
    },
    {
      name: 'tls_configuration',
      label: 'TLS Configuration',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'Disable TLS',
      enum: ['Disable TLS', 'Enable TLS'],
      enumDescriptions: {
        'Disable TLS': 'Disable TLS for origin server connections.',
        'Enable TLS': 'Enable TLS for origin server connections. Requires TLS certificates.',
      },
    },
    {
      name: 'load_balancer_algorithm',
      label: 'Load Balancer Algorithm',
      type: 'string',
      required: false,
      advanced: false,
      defaultValue: 'Round Robin',
      enum: ['Round Robin', 'Least Active', 'Ring Hash', 'Random'],
      enumDescriptions: {
        'Round Robin': 'Distribute requests evenly across all origin servers.',
        'Least Active': 'Send requests to the origin server with the fewest active connections.',
        'Ring Hash': 'Use consistent hashing based on a hash policy to select origin servers.',
        'Random': 'Randomly select an origin server for each request.',
      },
    },
    {
      name: 'health_check',
      label: 'Health Check',
      type: 'string',
      required: false,
      advanced: false,
      enum: [], // Populated from API
    },
  ],

  // Nested configurations
  nestedConfigs: [
    {
      name: 'use_tls',
      trigger: 'tls_configuration',
      triggerValue: 'Enable TLS',
      description: 'TLS configuration for secure origin server connections.',
      fields: [
        {
          name: 'tls_certificates',
          label: 'TLS Certificates',
          type: 'string',
          required: false,
          advanced: false,
          enum: [], // Populated from API
        },
        {
          name: 'tls_version',
          label: 'TLS Version',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'TLS 1.2+',
          enum: ['TLS 1.0+', 'TLS 1.1+', 'TLS 1.2+', 'TLS 1.3'],
        },
        {
          name: 'server_name_indication',
          label: 'Server Name Indication',
          type: 'string',
          required: false,
          advanced: false,
          maxLength: 256,
          format: 'hostname',
        },
        {
          name: 'skip_server_verification',
          label: 'Skip Server Verification',
          type: 'boolean',
          required: false,
          advanced: true,
          defaultValue: false,
        },
      ],
    },
    {
      name: 'ring_hash_config',
      trigger: 'load_balancer_algorithm',
      triggerValue: 'Ring Hash',
      description: 'Hash policy configuration for Ring Hash load balancing.',
      fields: [
        {
          name: 'hash_policy',
          label: 'Hash Policy',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Header Name',
          enum: ['Header Name', 'Cookie', 'Source IP'],
          enumDescriptions: {
            'Header Name': 'Hash based on a specific HTTP header value.',
            'Cookie': 'Hash based on a specific cookie value.',
            'Source IP': 'Hash based on the source IP address of the client.',
          },
        },
        {
          name: 'header_name',
          label: 'Header Name',
          type: 'string',
          required: false,
          advanced: false,
          conditionalOn: { field: 'hash_policy', value: 'Header Name' },
          minLength: 1,
          maxLength: 256,
          pattern: '^[A-Za-z][A-Za-z0-9-]*$',
          patternDescription: 'HTTP header name (starts with letter, alphanumeric with hyphens)',
        },
        {
          name: 'cookie_name',
          label: 'Cookie Name',
          type: 'string',
          required: false,
          advanced: false,
          conditionalOn: { field: 'hash_policy', value: 'Cookie' },
          minLength: 1,
          maxLength: 256,
          pattern: '^[A-Za-z_][A-Za-z0-9_]*$',
          patternDescription: 'Cookie name (starts with letter or underscore, alphanumeric with underscores)',
        },
      ],
    },
  ],

  // Array fields with item discriminators
  arrayFields: [
    {
      name: 'origin_servers',
      description: 'List of origin servers for this pool.',
      minItems: 1,
      maxItems: 100,
      addButtonLabel: 'Add Origin Server',
      itemDiscriminator: 'origin_server_type',
      apiProperty: 'origin_servers',
      itemTypes: {
        'Public DNS Name': {
          description: 'Origin server accessible via public DNS name.',
          apiNote: 'API: origin_servers[].public_name block',
          fields: [
            {
              name: 'dns_name',
              label: 'DNS Name',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].public_name.dns_name',
              minLength: 1,
              maxLength: 256, // API: ves.io.schema.rules.string.max_len: 256
              format: 'hostname',
            },
            {
              name: 'dns_refresh_interval',
              label: 'DNS Refresh Interval',
              type: 'number',
              required: false,
              advanced: true,
              defaultValue: 60,
              unit: 'seconds',
              apiProperty: 'origin_servers[].public_name.refresh_interval',
              apiNote: 'API validation: 0 or 10-604800 seconds (ves.io.schema.rules.uint32.ranges: "0,10-604800")',
              minimum: 0,
              maximum: 604800, // API: max is 7 days (604800 seconds)
            },
          ],
          requiredFields: ['dns_name'],
        },
        'K8s Service': {
          description: 'Origin server running as Kubernetes service.',
          apiNote: 'API: origin_servers[].k8s_service block. network_choice oneOf: inside_network, outside_network, vk8s_networks (empty objects)',
          fields: [
            {
              name: 'service_name',
              label: 'Service Name',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].k8s_service.service_name',
              apiNote: 'Format: servicename.namespace:cluster-ID (e.g., "frontend.speedtest:prod"). Namespace and cluster-ID are optional.',
              minLength: 1,
              maxLength: 1024, // API: max_len: 1024
              pattern: '^[a-zA-Z][a-zA-Z0-9.-]*(:.*)?$',
              patternDescription: 'Service name with optional namespace and cluster-ID (servicename.namespace:cluster-ID)',
            },
            {
              name: 'site_locator',
              label: 'Site Locator',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].k8s_service.site_locator.site.name',
              minLength: 1,
              maxLength: 63, // DNS-1035 label limit for site names
            },
            {
              name: 'vk8s_networks',
              label: 'vK8s Networks',
              type: 'string',
              required: false,
              advanced: false,
              enum: ['Site Local Network', 'Site Local Inside Network', 'Outside Network'],
              apiProperty: 'origin_servers[].k8s_service',
              apiNote: 'API oneOf: inside_network, outside_network, vk8s_networks (empty objects). UI value maps to corresponding API field.',
            },
            {
              name: 'service_port',
              label: 'Service Port',
              type: 'number',
              required: false,
              advanced: false,
              apiProperty: 'origin_servers[].k8s_service.service_port',
              minimum: 1,
              maximum: 65535,
            },
          ],
          requiredFields: ['service_name', 'site_locator'],
        },
        'Private IP': {
          description: 'Origin server accessible via private IP address.',
          apiNote: 'API: origin_servers[].private_ip block. network_choice oneOf: inside_network, outside_network, segment (mutually exclusive empty objects)',
          fields: [
            {
              name: 'ip_address',
              label: 'IP Address',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].private_ip.ip', // API field is "ip" not "ip_address"
              format: 'ipv4',
              maxLength: 1024, // API allows up to 1024 chars
            },
            {
              name: 'site_locator',
              label: 'Site Locator',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].private_ip.site_locator.site.name',
              minLength: 1,
              maxLength: 63, // DNS-1035 label limit for site names
            },
            {
              name: 'network_choice',
              label: 'Network',
              type: 'string',
              required: false,
              advanced: false,
              defaultValue: 'Outside Network',
              enum: ['Inside Network', 'Outside Network'],
              apiProperty: 'origin_servers[].private_ip',
              apiNote: 'API oneOf: inside_network, outside_network (empty objects). UI "Inside Network" → API {inside_network: {}}, UI "Outside Network" → API {outside_network: {}}',
            },
          ],
          requiredFields: ['ip_address', 'site_locator'],
        },
        'Public IP': {
          description: 'Origin server accessible via public IP address.',
          apiNote: 'API: origin_servers[].public_ip block',
          fields: [
            {
              name: 'ip_address',
              label: 'IP Address',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].public_ip.ip', // API field is "ip" not "ip_address"
              format: 'ipv4',
            },
          ],
          requiredFields: ['ip_address'],
        },
        'Consul Service': {
          description: 'Origin server discovered via Consul service registry.',
          apiNote: 'API: origin_servers[].consul_service block',
          fields: [
            {
              name: 'service_name',
              label: 'Service Name',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].consul_service.service_name',
              minLength: 1,
              maxLength: 256,
              pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$',
              patternDescription: 'Consul service name (alphanumeric with underscores and hyphens)',
            },
            {
              name: 'site_locator',
              label: 'Site Locator',
              type: 'string',
              required: true,
              advanced: false,
              apiProperty: 'origin_servers[].consul_service.site_locator.site.name',
              minLength: 1,
              maxLength: 63, // DNS-1035 label limit for site names
            },
            {
              name: 'network_type',
              label: 'Network Type',
              type: 'string',
              required: false,
              advanced: false,
              enum: ['Site Local Network', 'Site Local Inside Network'],
              apiProperty: 'origin_servers[].consul_service.network',
              apiNote: 'API uses network_choice oneOf with empty objects',
            },
          ],
          requiredFields: ['service_name', 'site_locator'],
        },
      },
    },
  ],

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    // Top-level fields
    name: 'The configuration object will be created with name. It has to be unique within the namespace.\nThe value of name has to follow DNS-1035 format.',
    labels: 'Map of string keys and values that can be used to organize and categorize\n(scope and select) objects as chosen by the user.',
    description: 'Human readable description for the object.',
    port: 'The port number to connect to on the origin server.\nThis is the default port for all origin servers in the pool.',
    tls_configuration: 'TLS configuration for connections to origin servers.\nSelect Enable TLS to encrypt traffic between the load balancer and origin servers.',
    load_balancer_algorithm: 'The algorithm used to select an origin server for each request.\nDetermines how traffic is distributed across origin servers.',
    health_check: 'Health check to use for this origin pool.\nThe health check monitors the availability of origin servers.',

    // TLS nested fields
    tls_certificates: 'TLS certificates to use for origin server connections.',
    tls_version: 'Minimum TLS version to use for origin server connections.',
    server_name_indication: 'Server Name Indication (SNI) to use in TLS handshake.\nUsed when the origin server hosts multiple domains.',
    skip_server_verification: 'Skip verification of origin server TLS certificates.\nWARNING: This reduces security and should only be used for testing.',

    // Ring Hash nested fields
    hash_policy: 'The policy used to generate hash values for origin server selection.\nDetermines which attribute is used for consistent hashing.',
    header_name: 'HTTP header name to use for hash calculation.',
    cookie_name: 'Cookie name to use for hash calculation.',

    // Origin server fields
    origin_servers: 'List of origin servers that form this pool.\nAt least one origin server must be configured.',
    origin_server_type: 'Type of origin server.\nDetermines how the origin server is discovered and connected to.',
    dns_name: 'Fully qualified domain name of the origin server.',
    dns_refresh_interval: 'Interval in seconds to refresh DNS resolution.',
    service_name: 'Name of the Kubernetes or Consul service.',
    site_locator: 'Site where the origin server is located.',
    vk8s_networks: 'Network to use for connecting to the Kubernetes service.',
    ip_address: 'IP address of the origin server.',
    network_choice: 'Network to use for connecting to the origin server (inside or outside network).',
    service_port: 'Port of the Kubernetes service.',
    network_type: 'Network type for Consul service discovery.',
  },

  // Top-level enum descriptions for discriminator fields
  enumDescriptions: {
    tls_configuration: {
      'Disable TLS': 'Disable TLS for origin server connections.',
      'Enable TLS': 'Enable TLS for origin server connections. Requires TLS certificates.',
    },
    load_balancer_algorithm: {
      'Round Robin': 'Distribute requests evenly across all origin servers.',
      'Least Active': 'Send requests to the origin server with the fewest active connections.',
      'Ring Hash': 'Use consistent hashing based on a hash policy to select origin servers.',
      'Random': 'Randomly select an origin server for each request.',
    },
    origin_server_type: {
      'Public DNS Name': 'Origin server accessible via public DNS name.',
      'K8s Service': 'Origin server running as Kubernetes service.',
      'Private IP': 'Origin server accessible via private IP address.',
      'Public IP': 'Origin server accessible via public IP address.',
      'Consul Service': 'Origin server discovered via Consul service registry.',
    },
    hash_policy: {
      'Header Name': 'Hash based on a specific HTTP header value.',
      'Cookie': 'Hash based on a specific cookie value.',
      'Source IP': 'Hash based on the source IP address of the client.',
    },
    tls_version: {
      'TLS 1.0+': 'Allow TLS 1.0 and above.',
      'TLS 1.1+': 'Allow TLS 1.1 and above.',
      'TLS 1.2+': 'Allow TLS 1.2 and above (recommended).',
      'TLS 1.3': 'Require TLS 1.3 only.',
    },
    vk8s_networks: {
      'Site Local Network': 'Connect via site local network.',
      'Site Local Inside Network': 'Connect via site local inside network.',
      'Outside Network': 'Connect via outside network.',
    },
  },
};
