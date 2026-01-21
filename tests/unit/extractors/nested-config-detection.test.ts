// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Nested Configuration Detection Tests
 *
 * Tests for detecting nested configuration dialogs and building hierarchical schemas.
 */

import { OneOfDetector } from '../../../src/extractors/oneof-detector';
import { SchemaGenerator } from '../../../src/extractors/schema-generator';
import { DetectedFormField } from '../../../src/handlers/form-handler';
import { SchemaGenerationInput } from '../../../src/types/schema-extractor';

describe('Nested Configuration Detection', () => {
  let detector: OneOfDetector;
  let generator: SchemaGenerator;

  beforeEach(() => {
    detector = new OneOfDetector();
    generator = new SchemaGenerator();
  });

  describe('detectNestedConfigButtons', () => {
    it('should detect Edit Configuration buttons for configuration fields', () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'field1',
          name: 'HTTP Configuration',
          type: 'combobox',
          required: false,
          disabled: false,
          options: ['HTTP', 'HTTPS'],
        },
        {
          uid: 'field2',
          name: 'Security Settings',
          type: 'listbox',
          required: false,
          disabled: false,
        },
        {
          uid: 'field3',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const triggers = detector.detectNestedConfigButtons(fields);

      expect(triggers).toHaveLength(2);
      expect(triggers[0].fieldName).toBe('HTTP Configuration');
      expect(triggers[1].fieldName).toBe('Security Settings');
    });

    it('should not detect nested config buttons for simple fields', () => {
      const fields: DetectedFormField[] = [
        {
          uid: 'field1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'field2',
          name: 'Timeout',
          type: 'spinbutton',
          required: false,
          disabled: false,
        },
      ];

      const triggers = detector.detectNestedConfigButtons(fields);

      expect(triggers).toHaveLength(0);
    });
  });

  describe('recordNestedConfigFields', () => {
    it('should record nested dialog fields correctly', () => {
      const dialogFields: DetectedFormField[] = [
        {
          uid: 'nested1',
          name: 'Path',
          type: 'textbox',
          required: true,
          disabled: false,
          defaultValue: '/health',
        },
        {
          uid: 'nested2',
          name: 'Use HTTP2',
          type: 'checkbox',
          required: false,
          disabled: false,
        },
      ];

      detector.recordNestedConfigFields(
        'HTTP Configuration',
        dialogFields,
        'Edit HTTP Configuration'
      );

      const nestedConfigs = detector.getNestedConfigs();

      expect(nestedConfigs).toHaveLength(1);
      expect(nestedConfigs[0].trigger).toBe('HTTP Configuration');
      expect(nestedConfigs[0].fields).toContain('Path');
      expect(nestedConfigs[0].fields).toContain('Use HTTP2');
      expect(nestedConfigs[0].dialogTitle).toBe('Edit HTTP Configuration');
    });

    it('should create snapshots for nested configurations', () => {
      const dialogFields: DetectedFormField[] = [
        {
          uid: 'nested1',
          name: 'Host Header',
          type: 'combobox',
          required: false,
          disabled: false,
          options: ['Origin Server Name', 'Custom Value'],
        },
      ];

      detector.recordNestedConfigFields('HTTP Configuration', dialogFields);

      const snapshots = detector.getSnapshots();

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].stateId).toBe('nested:HTTP Configuration');
      expect(snapshots[0].visibleFields).toContain('Host Header');
    });
  });

  describe('analyzeNestedOneOf', () => {
    it('should detect nested oneOf within HTTP configuration', () => {
      // Simulate HTTP config with Host Header dropdown (oneOf inside oneOf)
      const httpFields: DetectedFormField[] = [
        {
          uid: 'http1',
          name: 'Path',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'http2',
          name: 'Host Header',
          type: 'combobox',
          required: false,
          disabled: false,
          options: ['Origin Server Name', 'Custom Value'],
        },
      ];

      // Record states for Host Header options
      const originServerFields: DetectedFormField[] = [
        ...httpFields,
      ];

      const customValueFields: DetectedFormField[] = [
        ...httpFields,
        {
          uid: 'http3',
          name: 'Custom Host Header Value',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      detector.recordFieldState('Host Header', 'Origin Server Name', originServerFields);
      detector.recordFieldState('Host Header', 'Custom Value', customValueFields);

      const nestedRelationships = detector.analyzeNestedOneOf('HTTP', httpFields);

      expect(nestedRelationships).toHaveLength(1);
      expect(nestedRelationships[0].discriminatorField).toBe('Host Header');
      expect(nestedRelationships[0].options).toHaveLength(2);
    });
  });

  describe('SchemaGenerator - Nested Configurations', () => {
    it('should generate hierarchical schema for nested configurations', () => {
      const formFields: DetectedFormField[] = [
        {
          uid: 'field1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'field2',
          name: 'Health Check Type',
          type: 'combobox',
          required: true,
          disabled: false,
          options: ['HTTP', 'TCP'],
        },
        // Trigger field for nested configuration
        {
          uid: 'field3',
          name: 'HTTP Configuration',
          type: 'combobox',
          required: false,
          disabled: false,
          options: ['Edit Configuration'],
        },
        // Nested HTTP config fields
        {
          uid: 'http1',
          name: 'Path',
          type: 'textbox',
          required: true,
          disabled: false,
          defaultValue: '/health',
        },
        {
          uid: 'http2',
          name: 'Use HTTP2',
          type: 'checkbox',
          required: false,
          disabled: false,
        },
      ];

      const input: SchemaGenerationInput = {
        formFields,
        oneOfRelationships: [],
        metadata: {
          formUrl: 'https://test.example.com',
          resourceType: 'healthcheck',
          extractedAt: new Date().toISOString(),
          version: '1.0.0',
          nestedConfigurations: [
            {
              trigger: 'HTTP Configuration',
              fields: ['Path', 'Use HTTP2'],
              dialogTitle: 'Edit HTTP Configuration',
            },
          ],
        },
        formUrl: 'https://test.example.com',
      };

      const output = generator.generate(input);

      expect(output.schema.properties).toBeDefined();

      // The property name is generated from "HTTP Configuration" + "_config"
      // which normalizes to "http_configuration_config"
      const nestedConfigKey = Object.keys(output.schema.properties!).find(key =>
        key.includes('configuration') && key.includes('config')
      );

      expect(nestedConfigKey).toBeDefined();
      const nestedConfig = output.schema.properties![nestedConfigKey!];
      expect(nestedConfig.type).toBe('object');
      expect(nestedConfig.properties).toBeDefined();
      expect(nestedConfig.properties!['path']).toBeDefined();
      expect(nestedConfig.properties!['use_http2']).toBeDefined();
    });

    it('should include nested config metadata in x-f5xc-field', () => {
      const formFields: DetectedFormField[] = [
        {
          uid: 'trigger1',
          name: 'HTTP Configuration',
          type: 'combobox',
          required: false,
          disabled: false,
        },
        {
          uid: 'http1',
          name: 'Path',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const input: SchemaGenerationInput = {
        formFields,
        oneOfRelationships: [],
        metadata: {
          formUrl: 'https://test.example.com',
          resourceType: 'healthcheck',
          extractedAt: new Date().toISOString(),
          version: '1.0.0',
          nestedConfigurations: [
            {
              trigger: 'HTTP Configuration',
              fields: ['Path'],
            },
          ],
        },
        formUrl: 'https://test.example.com',
      };

      const output = generator.generate(input);

      // Find the nested config property
      const nestedConfigKey = Object.keys(output.schema.properties!).find(key =>
        key.includes('configuration') && key.includes('config')
      );

      expect(nestedConfigKey).toBeDefined();
      const nestedConfig = output.schema.properties![nestedConfigKey!];
      expect(nestedConfig['x-f5xc-field']).toBeDefined();
      expect(nestedConfig['x-f5xc-field']!.nestedConfig).toBe('HTTP Configuration');
    });
  });

  describe('Enhanced Field Metadata', () => {
    it('should extract validation constraints into x-f5xc-validation', () => {
      const formFields: DetectedFormField[] = [
        {
          uid: 'field1',
          name: 'Timeout',
          type: 'spinbutton',
          required: false,
          disabled: false,
          minimum: 1,
          maximum: 300,
        },
      ];

      const input: SchemaGenerationInput = {
        formFields,
        oneOfRelationships: [],
        metadata: {
          formUrl: 'https://test.example.com',
          resourceType: 'healthcheck',
          extractedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        formUrl: 'https://test.example.com',
      };

      const output = generator.generate(input);

      const timeoutField = output.schema.properties!['timeout'];
      expect(timeoutField['x-f5xc-validation']).toBeDefined();
      expect(timeoutField['x-f5xc-validation']!.minimum).toBe(1);
      expect(timeoutField['x-f5xc-validation']!.maximum).toBe(300);
    });

    it('should extract UI metadata into x-f5xc-ui', () => {
      const formFields: DetectedFormField[] = [
        {
          uid: 'field1',
          name: 'Name',
          type: 'textbox',
          required: true,
          disabled: false,
          placeholder: 'healthcheck-name',
          defaultValue: 'my-healthcheck',
          helpText: 'Enter a unique name for this healthcheck',
        },
      ];

      const input: SchemaGenerationInput = {
        formFields,
        oneOfRelationships: [],
        metadata: {
          formUrl: 'https://test.example.com',
          resourceType: 'healthcheck',
          extractedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        formUrl: 'https://test.example.com',
      };

      const output = generator.generate(input);

      const nameField = output.schema.properties!['name'];
      expect(nameField['x-f5xc-ui']).toBeDefined();
      expect(nameField['x-f5xc-ui']!.placeholder).toBe('healthcheck-name');
      expect(nameField['x-f5xc-ui']!.defaultValue).toBe('my-healthcheck');
      expect(nameField['x-f5xc-ui']!.helpText).toBe('Enter a unique name for this healthcheck');
    });

    it('should include uiLabel in x-f5xc-field', () => {
      const formFields: DetectedFormField[] = [
        {
          uid: 'field1',
          name: 'Health Check Type',
          type: 'combobox',
          required: true,
          disabled: false,
        },
      ];

      const input: SchemaGenerationInput = {
        formFields,
        oneOfRelationships: [],
        metadata: {
          formUrl: 'https://test.example.com',
          resourceType: 'healthcheck',
          extractedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        formUrl: 'https://test.example.com',
      };

      const output = generator.generate(input);

      const typeField = output.schema.properties!['health_check_type'];
      expect(typeField['x-f5xc-field']).toBeDefined();
      expect(typeField['x-f5xc-field']!.uiLabel).toBe('Health Check Type');
    });
  });
});
