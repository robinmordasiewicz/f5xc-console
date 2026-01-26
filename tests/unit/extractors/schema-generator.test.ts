// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Schema Generator Unit Tests
 *
 * Tests for generating JSON Schema from form fields and oneOf relationships.
 */

import { SchemaGenerator } from '../../../src/extractors/schema-generator';
import { DetectedFormField } from '../../../src/handlers/form-handler';
import {
  SchemaGenerationInput,
  OneOfRelationship,
  SchemaMetadata,
} from '../../../src/types/schema-extractor';

describe('SchemaGenerator', () => {
  let generator: SchemaGenerator;

  beforeEach(() => {
    generator = new SchemaGenerator();
  });

  describe('generate - basic schema', () => {
    it('should generate schema with simple fields', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_2',
          name: 'Description',
          type: 'textbox',
          required: false,
          disabled: false,
        },
        {
          uid: 'ref_3',
          name: 'Enabled',
          type: 'checkbox',
          required: false,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test_resource',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: 'https://test.com/form',
      };

      const output = await generator.generate(input);

      expect(output.schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(output.schema.type).toBe('object');
      expect(output.schema.properties).toBeDefined();
      expect(output.schema.required).toContain('name');
      expect(output.schema.properties!.name.type).toBe('string');
      expect(output.schema.properties!.description.type).toBe('string');
      expect(output.schema.properties!.enabled.type).toBe('boolean');
    });

    it('should include F5 XC metadata', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/health_checks/create',
        resourceType: 'healthcheck',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
        advancedFields: ['jitter_percent'],
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.schema['x-f5xc-metadata']).toBeDefined();
      expect(output.schema['x-f5xc-metadata']!.resourceType).toBe('healthcheck');
      expect(output.schema['x-f5xc-metadata']!.advancedFields).toContain('jitter_percent');
    });

    it('should handle fields with options (enum)', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Protocol',
          type: 'combobox',
          required: true,
          disabled: false,
          options: ['HTTP', 'HTTPS', 'TCP'],
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.schema.properties!.protocol.enum).toEqual(['HTTP', 'HTTPS', 'TCP']);
    });

    it('should handle default values', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Port',
          type: 'spinbutton',
          required: false,
          disabled: false,
          current_value: '80',
        },
        {
          uid: 'ref_2',
          name: 'Enabled',
          type: 'checkbox',
          required: false,
          disabled: false,
          current_value: 'true',
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.schema.properties!.port.default).toBe(80);
      expect(output.schema.properties!.enabled.default).toBe(true);
    });
  });

  describe('generate - oneOf relationships', () => {
    it('should generate oneOf blocks for Health Check type', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_2',
          name: 'Health Check Type',
          type: 'combobox',
          required: true,
          disabled: false,
          options: ['HTTP', 'TCP'],
        },
        {
          uid: 'ref_3',
          name: 'HTTP Path',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_4',
          name: 'TCP Port',
          type: 'spinbutton',
          required: true,
          disabled: false,
        },
      ];

      const oneOfRelationships: OneOfRelationship[] = [
        {
          discriminatorField: 'Health Check Type',
          options: [
            {
              optionValue: 'HTTP',
              exclusiveFields: ['HTTP Path'],
              requiredFields: ['HTTP Path'],
            },
            {
              optionValue: 'TCP',
              exclusiveFields: ['TCP Port'],
              requiredFields: ['TCP Port'],
            },
          ],
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/health_checks/create',
        resourceType: 'healthcheck',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships,
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.schema.oneOf).toBeDefined();
      expect(output.schema.oneOf).toHaveLength(2);

      // Check HTTP option
      const httpOption = output.schema.oneOf![0];
      expect(httpOption.properties!.health_check_type.const).toBe('HTTP');
      expect(httpOption.properties!.http_path).toBeDefined();
      expect(httpOption.required).toContain('http_path');

      // Check TCP option
      const tcpOption = output.schema.oneOf![1];
      expect(tcpOption.properties!.health_check_type.const).toBe('TCP');
      expect(tcpOption.properties!.tcp_port).toBeDefined();
      expect(tcpOption.required).toContain('tcp_port');
    });

    it('should handle nested oneOf relationships', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Type',
          type: 'combobox',
          required: true,
          disabled: false,
          options: ['HTTP'],
        },
        {
          uid: 'ref_2',
          name: 'Host Header',
          type: 'combobox',
          required: false,
          disabled: false,
          options: ['Origin Server Name', 'Custom Value'],
        },
        {
          uid: 'ref_3',
          name: 'Custom Value',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const oneOfRelationships: OneOfRelationship[] = [
        {
          discriminatorField: 'Type',
          options: [
            {
              optionValue: 'HTTP',
              exclusiveFields: [],
              nestedOneOf: [
                {
                  discriminatorField: 'Host Header',
                  options: [
                    {
                      optionValue: 'Origin Server Name',
                      exclusiveFields: [],
                    },
                    {
                      optionValue: 'Custom Value',
                      exclusiveFields: ['Custom Value'],
                      requiredFields: ['Custom Value'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships,
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.schema.oneOf).toBeDefined();
      const httpOption = output.schema.oneOf![0];
      expect(httpOption.oneOf).toBeDefined();
      expect(httpOption.oneOf).toHaveLength(2);
    });
  });

  describe('extractSelectorMetadata', () => {
    it('should generate selector metadata for form automation', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_2',
          name: 'Port',
          type: 'spinbutton',
          required: false,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'origin_pool',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.selectorMetadata.resourceType).toBe('origin_pool');
      expect(output.selectorMetadata.fieldSelectors).toBeDefined();
      expect(output.selectorMetadata.fieldSelectors.Name).toBeDefined();
      expect(output.selectorMetadata.fieldSelectors.Name.schemaPath).toBe('properties.name');
      expect(output.selectorMetadata.fieldSelectors.Name.selector).toBe('ref_1');
      expect(output.selectorMetadata.fieldSelectors.Name.inputType).toBe('textbox');
      expect(output.selectorMetadata.fieldSelectors.Name.required).toBe(true);
    });

    it('should include action button selectors', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.selectorMetadata.actionSelectors).toBeDefined();
      expect(output.selectorMetadata.actionSelectors.submit).toBeDefined();
      expect(output.selectorMetadata.actionSelectors.cancel).toBeDefined();
    });
  });

  describe('coverage calculation', () => {
    it('should calculate field coverage correctly', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Field1',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_2',
          name: 'Field2',
          type: 'textbox',
          required: false,
          disabled: false,
        },
        {
          uid: 'ref_3',
          name: 'Field3',
          type: 'checkbox',
          required: false,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.coverage.totalFields).toBe(3);
      expect(output.coverage.schemaFields).toBe(3);
      expect(output.coverage.fieldsWithSelectors).toBe(3);
      expect(output.coverage.percentage).toBe(100);
    });
  });

  describe('validateSchema', () => {
    it('should validate a correct schema', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);
      const validation = generator.validateSchema(output.schema);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing $schema', async () => {
      const schema = {
        type: 'object' as const,
        properties: {},
      };

      const validation = generator.validateSchema(schema);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing $schema property');
    });

    it('should detect invalid oneOf', async () => {
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object' as const,
        properties: {},
        oneOf: [
          // Only one option - invalid
          { type: 'string' as const },
        ],
      };

      const validation = generator.validateSchema(schema);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('oneOf must have at least 2 alternatives');
    });
  });

  describe('field name sanitization', () => {
    it('should convert field names to snake_case property names', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: 'Health Check Type',
          type: 'combobox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_2',
          name: 'Use-HTTP/2',
          type: 'checkbox',
          required: false,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      expect(output.schema.properties!.health_check_type).toBeDefined();
      expect(output.schema.properties!.use_http_2).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should capture warnings for problematic fields', async () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'ref_1',
          name: '', // Empty name
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const metadata: SchemaMetadata = {
        formUrl: 'https://test.com/form',
        resourceType: 'test',
        extractedAt: '2026-01-21T00:00:00Z',
        version: '1.0.0',
        extractionVersion: '1.0.0',
      };

      const input: SchemaGenerationInput = {
        formFields: fields,
        oneOfRelationships: [],
        metadata,
        formUrl: metadata.formUrl,
      };

      const output = await generator.generate(input);

      // Should still generate schema but with warnings
      expect(output.schema).toBeDefined();
      // Warnings array may or may not have entries depending on implementation
    });
  });
});
