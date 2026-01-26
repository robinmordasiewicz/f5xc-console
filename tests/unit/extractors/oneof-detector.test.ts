// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * OneOf Detector Unit Tests
 *
 * Tests for detecting oneOf relationships through DOM mutation analysis.
 */

import { OneOfDetector } from '../../../src/extractors/oneof-detector';
import { DetectedFormField } from '../../../src/handlers/form-handler';

describe('OneOfDetector', () => {
  let detector: OneOfDetector;

  beforeEach(() => {
    detector = new OneOfDetector();
  });

  describe('recordFieldState', () => {
    it('should record field state for a dropdown option', () => {
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
          name: 'Type',
          type: 'combobox',
          required: true,
          disabled: false,
          options: ['HTTP', 'TCP'],
        },
      ];

      detector.recordFieldState('Type', 'HTTP', fields);

      const snapshots = detector.getSnapshots();
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].stateId).toBe('Type:HTTP');
      expect(snapshots[0].visibleFields).toContain('Name');
      expect(snapshots[0].visibleFields).toContain('Type');
    });

    it('should track mutations between states', () => {
      const stateHTTP: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
        { uid: '2', name: 'Type', type: 'combobox', required: true, disabled: false },
        { uid: '3', name: 'HTTP Path', type: 'textbox', required: true, disabled: false },
      ];

      const stateTCP: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
        { uid: '2', name: 'Type', type: 'combobox', required: true, disabled: false },
        { uid: '4', name: 'TCP Port', type: 'spinbutton', required: true, disabled: false },
      ];

      detector.recordFieldState('Type', 'HTTP', stateHTTP);
      detector.recordFieldState('Type', 'TCP', stateTCP);

      const mutations = detector.getMutations();
      expect(mutations.length).toBeGreaterThan(0);

      // Should detect HTTP Path disappeared
      const disappeared = mutations.find(
        m => m.fieldName === 'HTTP Path' && m.mutationType === 'disappeared'
      );
      expect(disappeared).toBeDefined();

      // Should detect TCP Port appeared
      const appeared = mutations.find(
        m => m.fieldName === 'TCP Port' && m.mutationType === 'appeared'
      );
      expect(appeared).toBeDefined();
    });
  });

  describe('analyzeRelationships - Health Check Type Pattern', () => {
    it('should detect oneOf for Health Check type dropdown', () => {
      // Simulate Health Check form with HTTP/TCP/ICMP types
      const commonFields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
        { uid: '2', name: 'Health Check Type', type: 'combobox', required: true, disabled: false, options: ['HTTP', 'TCP', 'ICMP'] },
        { uid: '3', name: 'Timeout', type: 'spinbutton', required: false, disabled: false },
      ];

      const httpFields: DetectedFormField[] = [
        ...commonFields,
        { uid: '4', name: 'HTTP Path', type: 'textbox', required: true, disabled: false },
        { uid: '5', name: 'Use HTTP2', type: 'checkbox', required: false, disabled: false },
      ];

      const tcpFields: DetectedFormField[] = [
        ...commonFields,
        { uid: '6', name: 'TCP Port', type: 'spinbutton', required: true, disabled: false },
      ];

      const icmpFields: DetectedFormField[] = [
        ...commonFields,
        // ICMP has no exclusive fields
      ];

      detector.recordFieldState('Health Check Type', 'HTTP', httpFields);
      detector.recordFieldState('Health Check Type', 'TCP', tcpFields);
      detector.recordFieldState('Health Check Type', 'ICMP', icmpFields);

      const result = detector.analyzeRelationships();

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].discriminatorField).toBe('Health Check Type');
      expect(result.relationships[0].options).toHaveLength(3);

      // Check HTTP option
      const httpOption = result.relationships[0].options.find(o => o.optionValue === 'HTTP');
      expect(httpOption).toBeDefined();
      expect(httpOption!.exclusiveFields).toContain('HTTP Path');
      expect(httpOption!.exclusiveFields).toContain('Use HTTP2');

      // Check TCP option
      const tcpOption = result.relationships[0].options.find(o => o.optionValue === 'TCP');
      expect(tcpOption).toBeDefined();
      expect(tcpOption!.exclusiveFields).toContain('TCP Port');

      // Check ICMP option (no exclusive fields)
      const icmpOption = result.relationships[0].options.find(o => o.optionValue === 'ICMP');
      expect(icmpOption).toBeDefined();
      expect(icmpOption!.exclusiveFields).toHaveLength(0);

      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should identify required fields within oneOf options', () => {
      const baseFields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
        { uid: '2', name: 'Type', type: 'combobox', required: true, disabled: false },
      ];

      const httpFields: DetectedFormField[] = [
        ...baseFields,
        { uid: '3', name: 'Path', type: 'textbox', required: true, disabled: false },
        { uid: '4', name: 'Method', type: 'select', required: false, disabled: false },
      ];

      const tcpFields: DetectedFormField[] = [
        ...baseFields,
        { uid: '5', name: 'Port', type: 'spinbutton', required: true, disabled: false },
      ];

      // Need at least 2 states to detect oneOf
      detector.recordFieldState('Type', 'HTTP', httpFields);
      detector.recordFieldState('Type', 'TCP', tcpFields);

      const result = detector.analyzeRelationships();
      expect(result.relationships).toHaveLength(1);

      const httpOption = result.relationships[0].options.find(o => o.optionValue === 'HTTP');
      expect(httpOption).toBeDefined();
      expect(httpOption!.requiredFields).toContain('Path');
      expect(httpOption!.requiredFields).not.toContain('Method');
    });
  });

  describe('analyzeRelationships - Host Header Pattern', () => {
    it('should detect nested oneOf for Host Header configuration', () => {
      const baseFields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
        { uid: '2', name: 'Host Header', type: 'combobox', required: false, disabled: false, options: ['Origin Server Name', 'Custom Value'] },
      ];

      const originServerFields: DetectedFormField[] = [
        ...baseFields,
        // No additional fields for "Origin Server Name"
      ];

      const customValueFields: DetectedFormField[] = [
        ...baseFields,
        { uid: '3', name: 'Custom Value', type: 'textbox', required: true, disabled: false },
      ];

      detector.recordFieldState('Host Header', 'Origin Server Name', originServerFields);
      detector.recordFieldState('Host Header', 'Custom Value', customValueFields);

      const result = detector.analyzeRelationships();

      expect(result.relationships).toHaveLength(1);

      const customOption = result.relationships[0].options.find(
        o => o.optionValue === 'Custom Value'
      );
      expect(customOption).toBeDefined();
      expect(customOption!.exclusiveFields).toContain('Custom Value');
      expect(customOption!.requiredFields).toContain('Custom Value');
    });
  });

  describe('analyzeRelationships - No OneOf Pattern', () => {
    it('should detect when dropdown does not affect form structure', () => {
      const fields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
        { uid: '2', name: 'Protocol', type: 'combobox', required: true, disabled: false },
        { uid: '3', name: 'Port', type: 'spinbutton', required: true, disabled: false },
      ];

      // Same fields for both options
      detector.recordFieldState('Protocol', 'HTTP', fields);
      detector.recordFieldState('Protocol', 'HTTPS', fields);

      const result = detector.analyzeRelationships();

      expect(result.relationships).toHaveLength(0);
      expect(result.ambiguities).toBeDefined();
      expect(result.ambiguities!.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('reset', () => {
    it('should clear all recorded states', () => {
      const fields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
      ];

      detector.recordFieldState('Type', 'HTTP', fields);
      expect(detector.getSnapshots()).toHaveLength(1);

      detector.reset();

      expect(detector.getSnapshots()).toHaveLength(0);
      expect(detector.getMutations()).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty field sets', () => {
      detector.recordFieldState('Type', 'Option1', []);
      detector.recordFieldState('Type', 'Option2', []);

      const result = detector.analyzeRelationships();
      expect(result.relationships).toHaveLength(0);
    });

    it('should handle single option', () => {
      const fields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
      ];

      detector.recordFieldState('Type', 'OnlyOption', fields);

      const result = detector.analyzeRelationships();
      // Single option can't create meaningful oneOf
      expect(result.relationships.length).toBeLessThanOrEqual(1);
    });

    it('should handle identical field sets with different values', () => {
      const fields1: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false, current_value: 'test1' },
      ];

      const fields2: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false, current_value: 'test2' },
      ];

      detector.recordFieldState('Type', 'Option1', fields1);
      detector.recordFieldState('Type', 'Option2', fields2);

      const result = detector.analyzeRelationships();

      // Same structure, different values - no oneOf
      expect(result.relationships).toHaveLength(0);
    });
  });

  describe('confidence calculation', () => {
    it('should increase confidence for detected relationships', () => {
      const baseFields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
      ];

      const option1Fields: DetectedFormField[] = [
        ...baseFields,
        { uid: '2', name: 'Field1', type: 'textbox', required: false, disabled: false },
      ];

      const option2Fields: DetectedFormField[] = [
        ...baseFields,
        { uid: '3', name: 'Field2', type: 'textbox', required: false, disabled: false },
      ];

      detector.recordFieldState('Type', 'Option1', option1Fields);
      detector.recordFieldState('Type', 'Option2', option2Fields);

      const result = detector.analyzeRelationships();

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.relationships).toHaveLength(1);
    });

    it('should decrease confidence for ambiguities', () => {
      const fields: DetectedFormField[] = [
        { uid: '1', name: 'Name', type: 'textbox', required: true, disabled: false },
      ];

      // Same fields for all options - creates ambiguity
      detector.recordFieldState('Type', 'Option1', fields);
      detector.recordFieldState('Type', 'Option2', fields);
      detector.recordFieldState('Type', 'Option3', fields);

      const result = detector.analyzeRelationships();

      expect(result.confidence).toBeLessThan(0.7);
      expect(result.ambiguities).toBeDefined();
    });
  });
});
