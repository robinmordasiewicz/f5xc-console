// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { ConfigurationService } from '../../src/config/configuration-service';
import { ResourceConfig, JSONSchema } from '../../src/types/schema-extractor';

export class TestUtils {
  static createMockConfigService(mockConfigs: Record<string, ResourceConfig>): ConfigurationService {
    const service = ConfigurationService.getInstance();

    return service;
  }

  static normalizeForComparison(schema: any): any {
    const normalized = JSON.parse(JSON.stringify(schema));

    if (normalized['x-f5xc-metadata']) {
      delete normalized['x-f5xc-metadata'].extractedAt;

      if (normalized['x-f5xc-metadata'].apiDiscovery?.references) {
        for (const ref of normalized['x-f5xc-metadata'].apiDiscovery.references) {
          delete ref.lastFetched;
        }
      }
    }

    return normalized;
  }

  static assertValidSchema(schema: JSONSchema): void {
    if (!schema.$schema) {
      throw new Error('Schema must have $schema field');
    }
    if (schema.$schema !== 'http://json-schema.org/draft-07/schema#') {
      throw new Error('Schema must use JSON Schema draft-07');
    }
    if (schema.type !== 'object') {
      throw new Error('Root schema type must be "object"');
    }
    if (!schema.properties) {
      throw new Error('Schema must have properties');
    }
    if (!schema['x-f5xc-metadata']) {
      throw new Error('Schema missing x-f5xc-metadata');
    }
  }

  static assertSchemaEquals(schema1: any, schema2: any): void {
    const normalized1 = this.normalizeForComparison(schema1);
    const normalized2 = this.normalizeForComparison(schema2);

    if (JSON.stringify(normalized1) !== JSON.stringify(normalized2)) {
      throw new Error('Schemas are not equal after normalization');
    }
  }

  static createMockSchema(overrides: any = {}): JSONSchema {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Resource name',
          ...overrides.properties?.name,
        },
      },
      required: ['name'],
      'x-f5xc-metadata': {
        extractedAt: '2026-01-21T00:00:00.000Z',
        extractionVersion: '1.0.0',
        resourceType: 'test-resource',
        formUrl: 'https://test.example.com',
        version: '1.0.0',
        ...overrides['x-f5xc-metadata'],
      },
    };
  }
}
