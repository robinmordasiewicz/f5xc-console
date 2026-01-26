// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Array Field Handler Unit Tests (Phase 2)
 *
 * Tests array field detection, item template capture, and schema generation.
 */

import { ArrayFieldHandler, ArrayFieldInfo, ArrayItemTemplate } from '../../../src/handlers/array-field-handler';
import { ParsedSnapshot } from '../../../src/mcp/snapshot-parser';
import { DetectedFormField } from '../../../src/handlers/form-handler';
import { OneOfRelationship } from '../../../src/types/schema-extractor';

describe('ArrayFieldHandler', () => {
  let handler: ArrayFieldHandler;

  beforeEach(() => {
    handler = new ArrayFieldHandler();
  });

  describe('detectArrayFields', () => {
    it('should detect "Add Origin Server" button as array field', () => {
      const snapshot: ParsedSnapshot = {
        elements: [
          {
            uid: 'ref_1',
            role: 'button',
            name: 'Add Origin Server',
            level: 0,
            raw: '',
          },
        ],
        byUid: new Map(),
        byRole: new Map(),
      };

      const detected = handler.detectArrayFields(snapshot);

      expect(detected).toHaveLength(1);
      expect(detected[0].fieldName).toBe('origin_servers');
      expect(detected[0].addButtonLabel).toBe('Add Origin Server');
      expect(detected[0].addButtonSelector).toBe('ref_1');
    });

    it('should detect "Add Item" button as generic array field', () => {
      const snapshot: ParsedSnapshot = {
        elements: [
          {
            uid: 'ref_100',
            role: 'button',
            name: 'Add Item',
            level: 0,
            raw: '',
          },
        ],
        byUid: new Map(),
        byRole: new Map(),
      };

      const detected = handler.detectArrayFields(snapshot);

      expect(detected).toHaveLength(1);
      expect(detected[0].fieldName).toBe('items');
      expect(detected[0].addButtonLabel).toBe('Add Item');
    });

    it('should detect "Add More" button', () => {
      const snapshot: ParsedSnapshot = {
        elements: [
          {
            uid: 'ref_200',
            role: 'button',
            name: 'Add More Certificates',
            level: 0,
            raw: '',
          },
        ],
        byUid: new Map(),
        byRole: new Map(),
      };

      const detected = handler.detectArrayFields(snapshot);

      expect(detected).toHaveLength(1);
      expect(detected[0].fieldName).toBe('certificates');
    });

    it('should not detect non-array buttons', () => {
      const snapshot: ParsedSnapshot = {
        elements: [
          {
            uid: 'ref_1',
            role: 'button',
            name: 'Submit',
            level: 0,
            raw: '',
          },
          {
            uid: 'ref_2',
            role: 'button',
            name: 'Cancel',
            level: 0,
            raw: '',
          },
        ],
        byUid: new Map(),
        byRole: new Map(),
      };

      const detected = handler.detectArrayFields(snapshot);

      expect(detected).toHaveLength(0);
    });

    it('should handle multiple array fields', () => {
      const snapshot: ParsedSnapshot = {
        elements: [
          {
            uid: 'ref_1',
            role: 'button',
            name: 'Add Origin Server',
            level: 0,
            raw: '',
          },
          {
            uid: 'ref_2',
            role: 'button',
            name: 'Add Health Check',
            level: 0,
            raw: '',
          },
        ],
        byUid: new Map(),
        byRole: new Map(),
      };

      const detected = handler.detectArrayFields(snapshot);

      expect(detected).toHaveLength(2);
      expect(detected[0].fieldName).toBe('origin_servers');
      expect(detected[1].fieldName).toBe('health_checks');
    });
  });

  describe('captureArrayItemTemplate', () => {
    it('should capture item template from fields', () => {
      const arrayInfo: ArrayFieldInfo = {
        fieldName: 'origin_servers',
        apiProperty: 'origin_servers',
        addButtonSelector: 'ref_1',
        addButtonLabel: 'Add Origin Server',
      };

      const itemFields: DetectedFormField[] = [
        {
          uid: 'ref_10',
          name: 'DNS Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_11',
          name: 'Port',
          type: 'spinbutton',
          required: false,
          disabled: false,
        },
      ];

      const template = handler.captureArrayItemTemplate(arrayInfo, itemFields);

      expect(template.fields).toHaveLength(2);
      expect(template.itemSchema).toBeDefined();
      expect(template.itemSchema.type).toBe('object');
      expect(template.itemSchema.properties.dns_name).toBeDefined();
      expect(template.itemSchema.properties.port).toBeDefined();
      expect(template.itemSchema.required).toContain('dns_name');
    });

    it('should detect discriminator field in item template', () => {
      const arrayInfo: ArrayFieldInfo = {
        fieldName: 'origin_servers',
        apiProperty: 'origin_servers',
        addButtonSelector: 'ref_1',
        addButtonLabel: 'Add Origin Server',
      };

      const itemFields: DetectedFormField[] = [
        {
          uid: 'ref_10',
          name: 'Origin Server Type',
          type: 'listbox',
          required: true,
          disabled: false,
          options: ['Public DNS Name', 'K8s Service', 'Private IP'],
        },
        {
          uid: 'ref_11',
          name: 'DNS Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
      ];

      const template = handler.captureArrayItemTemplate(
        arrayInfo,
        itemFields,
        'Origin Server Type'
      );

      expect(template.discriminator).toBe('Origin Server Type');
      expect(template.discriminatorOptions).toEqual(['Public DNS Name', 'K8s Service', 'Private IP']);
    });
  });

  describe('generateArraySchema', () => {
    it('should generate array schema without discriminator', () => {
      const arrayInfo: ArrayFieldInfo = {
        fieldName: 'tags',
        apiProperty: 'tags',
        addButtonSelector: 'ref_1',
        addButtonLabel: 'Add Tag',
        minItems: 1,
        maxItems: 10,
      };

      const itemTemplate: ArrayItemTemplate = {
        fields: [
          {
            uid: 'ref_10',
            name: 'Key',
            type: 'textbox',
            required: true,
            disabled: false,
          },
          {
            uid: 'ref_11',
            name: 'Value',
            type: 'textbox',
            required: true,
            disabled: false,
          },
        ],
        itemSchema: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
          required: ['key', 'value'],
        },
      };

      const schema = handler.generateArraySchema(arrayInfo, itemTemplate);

      expect(schema.type).toBe('array');
      expect(schema.minItems).toBe(1);
      expect(schema.maxItems).toBe(10);
      expect(schema.items).toEqual(itemTemplate.itemSchema);
      expect(schema['x-f5xc-array']).toBeDefined();
      expect(schema['x-f5xc-array'].addButtonLabel).toBe('Add Tag');
    });

    it('should generate array schema with discriminated union', () => {
      const arrayInfo: ArrayFieldInfo = {
        fieldName: 'origin_servers',
        apiProperty: 'origin_servers',
        addButtonSelector: 'ref_1',
        addButtonLabel: 'Add Origin Server',
        minItems: 1,
      };

      const itemTemplate: ArrayItemTemplate = {
        fields: [],
        discriminator: 'Origin Server Type',
        discriminatorOptions: ['Public DNS Name', 'K8s Service'],
        itemSchema: {},
      };

      const oneOfRel: OneOfRelationship = {
        discriminatorField: 'Origin Server Type',
        options: [
          {
            optionValue: 'Public DNS Name',
            exclusiveFields: ['DNS Name'],
            requiredFields: ['DNS Name'],
          },
          {
            optionValue: 'K8s Service',
            exclusiveFields: ['Service Name', 'Site Locator'],
            requiredFields: ['Service Name'],
          },
        ],
      };

      // Add fields to template
      itemTemplate.fields = [
        {
          uid: 'ref_10',
          name: 'Origin Server Type',
          type: 'listbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_11',
          name: 'DNS Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_12',
          name: 'Service Name',
          type: 'textbox',
          required: true,
          disabled: false,
        },
        {
          uid: 'ref_13',
          name: 'Site Locator',
          type: 'combobox',
          required: false,
          disabled: false,
        },
      ];

      const schema = handler.generateArraySchema(arrayInfo, itemTemplate, oneOfRel);

      expect(schema.type).toBe('array');
      expect(schema.items.oneOf).toBeDefined();
      expect(schema.items.oneOf).toHaveLength(2);

      // Check first oneOf option (Public DNS Name)
      const publicDnsOption = schema.items.oneOf[0];
      expect(publicDnsOption.properties.origin_server_type.const).toBe('Public DNS Name');
      expect(publicDnsOption.properties.dns_name).toBeDefined();

      // Check second oneOf option (K8s Service)
      const k8sOption = schema.items.oneOf[1];
      expect(k8sOption.properties.origin_server_type.const).toBe('K8s Service');
      expect(k8sOption.properties.service_name).toBeDefined();
      expect(k8sOption.properties.site_locator).toBeDefined();
    });
  });

  describe('array field tracking', () => {
    it('should track detected array fields', () => {
      const snapshot: ParsedSnapshot = {
        elements: [
          {
            uid: 'ref_1',
            role: 'button',
            name: 'Add Origin Server',
            level: 0,
            raw: '',
          },
        ],
        byUid: new Map(),
        byRole: new Map(),
      };

      handler.detectArrayFields(snapshot);

      expect(handler.isArrayField('origin_servers')).toBe(true);
      expect(handler.isArrayField('other_field')).toBe(false);

      const info = handler.getArrayFieldInfo('origin_servers');
      expect(info).toBeDefined();
      expect(info?.fieldName).toBe('origin_servers');
    });

    it('should return all detected arrays', () => {
      const snapshot: ParsedSnapshot = {
        elements: [
          {
            uid: 'ref_1',
            role: 'button',
            name: 'Add Origin Server',
            level: 0,
            raw: '',
          },
          {
            uid: 'ref_2',
            role: 'button',
            name: 'Add Health Check',
            level: 0,
            raw: '',
          },
        ],
        byUid: new Map(),
        byRole: new Map(),
      };

      handler.detectArrayFields(snapshot);

      const detectedArrays = handler.getDetectedArrays();
      expect(detectedArrays.size).toBe(2);
      expect(detectedArrays.has('origin_servers')).toBe(true);
      expect(detectedArrays.has('health_checks')).toBe(true);
    });
  });
});
