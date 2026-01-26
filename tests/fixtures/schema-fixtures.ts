// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { ResourceConfig } from '../../src/types/schema-extractor';

export const MOCK_HEALTHCHECK_CONFIG: ResourceConfig = {
  resourceType: 'healthcheck',
  description: 'F5 XC Health Check resource',
  api_type: 'ves.io.schema.healthcheck.Object',
  field_mappings: {
    name: 'metadata.name',
    labels: 'metadata.labels',
    description: 'metadata.description',
  },
  discriminators: [
    {
      field: 'health_check_type',
      api_property: 'health_check',
      options: {
        http: { api_path: 'http_health_check' },
        tcp: { api_path: 'tcp_health_check' },
        icmp: { api_path: 'icmp_ping_health_check' },
      },
    },
  ],
};

export const MOCK_ORIGIN_POOL_CONFIG: ResourceConfig = {
  resourceType: 'origin_pool',
  description: 'F5 XC Origin Pool resource',
  api_type: 'ves.io.schema.views.origin_pool.Object',
  field_mappings: {
    name: 'metadata.name',
    labels: 'metadata.labels',
    description: 'metadata.description',
    port: 'port',
  },
  discriminators: [
    {
      field: 'tls_configuration',
      api_property: 'tls',
      options: {
        no_tls: { api_path: 'no_tls' },
        use_tls: { api_path: 'use_tls' },
      },
    },
  ],
  arrays: [
    {
      field: 'origin_servers',
      api_property: 'origin_servers',
      min_items: 1,
      max_items: 100,
      add_button_text: 'Add Item',
      item_discriminator: 'origin_server_type',
      description: 'Repeating origin server configuration blocks',
      item_types: {
        public_dns_name: {
          api_path: 'origin_servers[].public_name',
          fields: {
            dns_name: 'dns_name',
          },
          required: ['dns_name'],
          description: 'Public DNS name configuration',
        },
        k8s_service: {
          api_path: 'origin_servers[].k8s_service',
          fields: {
            service_name: 'service_name',
            site_locator: 'site_locator',
          },
          required: ['service_name'],
          description: 'Kubernetes service configuration',
        },
      },
    },
  ],
};

export const MOCK_SCHEMA_OUTPUT = {
  schema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Resource name',
      },
    },
    'x-f5xc-metadata': {
      extractedAt: '2026-01-21T00:00:00.000Z',
      extractionVersion: '1.0.0',
      resourceType: 'healthcheck',
      formUrl: 'https://example.com',
      version: '1.0.0',
    },
  },
  selectorMetadata: {
    resourceType: 'healthcheck',
    fieldSelectors: {},
    actionSelectors: {},
  },
  warnings: [],
  coverage: {
    totalFields: 10,
    schemaFields: 9,
    fieldsWithSelectors: 9,
    percentage: 90,
  },
};
