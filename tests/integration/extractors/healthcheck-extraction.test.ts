// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Health Check Schema Extraction Integration Test
 *
 * End-to-end test for extracting JSON Schema from F5 XC Health Check form.
 * Tests the complete workflow: baseline capture → oneOf detection → schema generation.
 */

import { FormHandler, DetectedFormField } from '../../../src/handlers/form-handler';
import { OneOfDetector } from '../../../src/extractors/oneof-detector';
import { SchemaGenerator } from '../../../src/extractors/schema-generator';
import { createSchemaExtractor } from '../../../src/extractors/schema-extractor';
import { ParsedSnapshot, getSnapshotParser } from '../../../src/mcp/snapshot-parser';
import {
  SchemaGenerationInput,
  SchemaMetadata,
} from '../../../src/types/schema-extractor';

describe('Health Check Schema Extraction Integration', () => {
  /**
   * Simulate a baseline health check form snapshot with all three types available
   */
  const createBaselineSnapshot = (): ParsedSnapshot => {
    return {
      elements: [
        {
          uid: 'ref_1',
          role: 'textbox',
          name: 'Name',
          level: 0,
          disabled: false,
          required: true,
        },
        {
          uid: 'ref_2',
          role: 'combobox',
          name: 'Health Check Type',
          level: 0,
          disabled: false,
          required: true,
        },
        {
          uid: 'ref_3',
          role: 'option',
          name: 'HTTP',
          level: 1,
        },
        {
          uid: 'ref_4',
          role: 'option',
          name: 'TCP',
          level: 1,
        },
        {
          uid: 'ref_5',
          role: 'option',
          name: 'ICMP',
          level: 1,
        },
        {
          uid: 'ref_6',
          role: 'spinbutton',
          name: 'Timeout',
          level: 0,
          disabled: false,
          value: '10',
        },
        {
          uid: 'ref_7',
          role: 'spinbutton',
          name: 'Interval',
          level: 0,
          disabled: false,
          value: '5',
        },
        {
          uid: 'ref_8',
          role: 'spinbutton',
          name: 'Unhealthy Threshold',
          level: 0,
          disabled: false,
          value: '3',
        },
        {
          uid: 'ref_9',
          role: 'spinbutton',
          name: 'Healthy Threshold',
          level: 0,
          disabled: false,
          value: '2',
        },
        {
          uid: 'ref_10',
          role: 'spinbutton',
          name: 'Jitter Percent',
          level: 0,
          disabled: false,
          value: '0',
        },
      ],
    };
  };

  /**
   * Simulate HTTP health check state with exclusive fields
   */
  const createHTTPSnapshot = (): ParsedSnapshot => {
    return {
      elements: [
        ...createBaselineSnapshot().elements.filter(e => e.role !== 'option'),
        {
          uid: 'ref_11',
          role: 'textbox',
          name: 'Path',
          level: 0,
          disabled: false,
          placeholder: '/health',
        },
        {
          uid: 'ref_12',
          role: 'checkbox',
          name: 'Use HTTP2',
          level: 0,
          disabled: false,
        },
        {
          uid: 'ref_13',
          role: 'combobox',
          name: 'Host Header',
          level: 0,
          disabled: false,
        },
        {
          uid: 'ref_14',
          role: 'option',
          name: 'Origin Server Name',
          level: 1,
        },
        {
          uid: 'ref_15',
          role: 'option',
          name: 'Custom Value',
          level: 1,
        },
      ],
    };
  };

  /**
   * Simulate TCP health check state with exclusive fields
   */
  const createTCPSnapshot = (): ParsedSnapshot => {
    return {
      elements: [
        ...createBaselineSnapshot().elements.filter(e => e.role !== 'option'),
        {
          uid: 'ref_16',
          role: 'spinbutton',
          name: 'Port',
          level: 0,
          disabled: false,
          value: '80',
        },
      ],
    };
  };

  /**
   * Simulate ICMP health check state (no exclusive fields)
   */
  const createICMPSnapshot = (): ParsedSnapshot => {
    return {
      elements: [...createBaselineSnapshot().elements.filter(e => e.role !== 'option')],
    };
  };

  /**
   * Simulate HTTP Host Header = Custom Value state
   */
  const createHTTPCustomHostHeaderSnapshot = (): ParsedSnapshot => {
    return {
      elements: [
        ...createHTTPSnapshot().elements.filter(e => e.role !== 'option'),
        {
          uid: 'ref_17',
          role: 'textbox',
          name: 'Custom Value',
          level: 0,
          disabled: false,
          required: true,
        },
      ],
    };
  };

  it('should extract complete health check schema with oneOf relationships', async () => {
    const formHandler = new FormHandler();
    const detector = new OneOfDetector();
    const generator = new SchemaGenerator();

    // Step 1: Detect baseline fields
    const baselineSnapshot = createBaselineSnapshot();
    const baselineFields = formHandler.detectFormFields(baselineSnapshot);

    expect(baselineFields).toHaveLength(10); // Name + Type dropdown + 5 options + 4 common fields

    // Step 2: Record states for Health Check Type dropdown
    const httpSnapshot = createHTTPSnapshot();
    const tcpSnapshot = createTCPSnapshot();
    const icmpSnapshot = createICMPSnapshot();

    const httpFields = formHandler.detectFormFields(httpSnapshot);
    const tcpFields = formHandler.detectFormFields(tcpSnapshot);
    const icmpFields = formHandler.detectFormFields(icmpSnapshot);

    detector.recordFieldState('Health Check Type', 'HTTP', httpFields);
    detector.recordFieldState('Health Check Type', 'TCP', tcpFields);
    detector.recordFieldState('Health Check Type', 'ICMP', icmpFields);

    // Step 3: Analyze oneOf relationships
    const oneOfAnalysis = detector.analyzeRelationships();

    expect(oneOfAnalysis.relationships).toHaveLength(1);
    expect(oneOfAnalysis.relationships[0].discriminatorField).toBe('Health Check Type');
    expect(oneOfAnalysis.relationships[0].options).toHaveLength(3);
    expect(oneOfAnalysis.confidence).toBeGreaterThan(0.7);

    // Check HTTP option
    const httpOption = oneOfAnalysis.relationships[0].options.find(o => o.optionValue === 'HTTP');
    expect(httpOption).toBeDefined();
    expect(httpOption!.exclusiveFields).toContain('Path');
    expect(httpOption!.exclusiveFields).toContain('Use HTTP2');
    expect(httpOption!.exclusiveFields).toContain('Host Header');

    // Check TCP option
    const tcpOption = oneOfAnalysis.relationships[0].options.find(o => o.optionValue === 'TCP');
    expect(tcpOption).toBeDefined();
    expect(tcpOption!.exclusiveFields).toContain('Port');

    // Check ICMP option
    const icmpOption = oneOfAnalysis.relationships[0].options.find(o => o.optionValue === 'ICMP');
    expect(icmpOption).toBeDefined();
    expect(icmpOption!.exclusiveFields).toHaveLength(0);

    // Step 4: Generate schema
    const metadata: SchemaMetadata = {
      formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/namespaces/*/manage/health_checks/create',
      resourceType: 'healthcheck',
      extractedAt: new Date().toISOString(),
      version: '1.0.0',
      advancedFields: ['Jitter Percent'],
    };

    const generationInput: SchemaGenerationInput = {
      formFields: httpFields, // Use HTTP fields as baseline (most complete)
      oneOfRelationships: oneOfAnalysis.relationships,
      metadata,
      formUrl: metadata.formUrl,
    };

    const output = generator.generate(generationInput);

    // Step 5: Validate generated schema
    expect(output.schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(output.schema.title).toContain('Health Check');
    expect(output.schema.type).toBe('object');
    expect(output.schema.properties).toBeDefined();
    expect(output.schema.oneOf).toBeDefined();
    expect(output.schema.oneOf).toHaveLength(3);

    // Validate HTTP oneOf option
    const schemaHTTPOption = output.schema.oneOf![0];
    expect(schemaHTTPOption.properties!.health_check_type.const).toBe('HTTP');
    expect(schemaHTTPOption.properties!.path).toBeDefined();
    expect(schemaHTTPOption.properties!.use_http2).toBeDefined();
    expect(schemaHTTPOption.properties!.host_header).toBeDefined();

    // Validate TCP oneOf option
    const schemaTCPOption = output.schema.oneOf![1];
    expect(schemaTCPOption.properties!.health_check_type.const).toBe('TCP');
    expect(schemaTCPOption.properties!.port).toBeDefined();

    // Validate ICMP oneOf option
    const schemaICMPOption = output.schema.oneOf![2];
    expect(schemaICMPOption.properties!.health_check_type.const).toBe('ICMP');

    // Validate metadata
    expect(output.schema['x-f5xc-metadata']).toBeDefined();
    expect(output.schema['x-f5xc-metadata']!.resourceType).toBe('healthcheck');
    expect(output.schema['x-f5xc-metadata']!.advancedFields).toContain('Jitter Percent');

    // Validate selector metadata
    expect(output.selectorMetadata.resourceType).toBe('healthcheck');
    expect(output.selectorMetadata.fieldSelectors).toBeDefined();
    expect(Object.keys(output.selectorMetadata.fieldSelectors).length).toBeGreaterThan(0);

    // Validate coverage
    expect(output.coverage.percentage).toBeGreaterThan(80);

    // Validate schema structure
    const validation = generator.validateSchema(output.schema);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect nested oneOf for HTTP Host Header', async () => {
    const formHandler = new FormHandler();
    const detector = new OneOfDetector();

    // Capture HTTP with Host Header = Origin Server Name
    const httpOriginSnapshot = createHTTPSnapshot();
    const httpOriginFields = formHandler.detectFormFields(httpOriginSnapshot);

    // Capture HTTP with Host Header = Custom Value
    const httpCustomSnapshot = createHTTPCustomHostHeaderSnapshot();
    const httpCustomFields = formHandler.detectFormFields(httpCustomSnapshot);

    detector.recordFieldState('Host Header', 'Origin Server Name', httpOriginFields);
    detector.recordFieldState('Host Header', 'Custom Value', httpCustomFields);

    const result = detector.analyzeRelationships();

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].discriminatorField).toBe('Host Header');

    const customOption = result.relationships[0].options.find(o => o.optionValue === 'Custom Value');
    expect(customOption).toBeDefined();
    expect(customOption!.exclusiveFields).toContain('Custom Value');
    expect(customOption!.requiredFields).toContain('Custom Value');
  });

  it('should use SchemaExtractor orchestrator for complete workflow', async () => {
    const extractor = createSchemaExtractor({
      outputDir: './test-output',
      expandAdvancedFields: true,
      validateSchema: true,
    });

    // Prepare snapshots
    const baselineSnapshot = createHTTPSnapshot(); // Use HTTP as baseline
    const stateSnapshots = [
      {
        dropdownName: 'Health Check Type',
        optionValue: 'HTTP',
        snapshot: createHTTPSnapshot(),
      },
      {
        dropdownName: 'Health Check Type',
        optionValue: 'TCP',
        snapshot: createTCPSnapshot(),
      },
      {
        dropdownName: 'Health Check Type',
        optionValue: 'ICMP',
        snapshot: createICMPSnapshot(),
      },
    ];

    const output = await extractor.extractFromSnapshot({
      baselineSnapshot,
      resourceType: 'healthcheck',
      formUrl: 'https://test.com/health_checks/create',
      stateSnapshots,
    });

    expect(output.schema).toBeDefined();
    expect(output.schema.oneOf).toHaveLength(3);
    expect(output.selectorMetadata).toBeDefined();
    expect(output.coverage.percentage).toBeGreaterThan(80);
    expect(output.warnings).toBeDefined();
  });

  it('should handle mutations correctly', async () => {
    const detector = new OneOfDetector();
    const formHandler = new FormHandler();

    const httpFields = formHandler.detectFormFields(createHTTPSnapshot());
    const tcpFields = formHandler.detectFormFields(createTCPSnapshot());

    detector.recordFieldState('Type', 'HTTP', httpFields);
    detector.recordFieldState('Type', 'TCP', tcpFields);

    const mutations = detector.getMutations();

    // Should detect fields that appeared/disappeared
    expect(mutations.length).toBeGreaterThan(0);

    const appeared = mutations.filter(m => m.mutationType === 'appeared');
    const disappeared = mutations.filter(m => m.mutationType === 'disappeared');

    expect(appeared.length).toBeGreaterThan(0);
    expect(disappeared.length).toBeGreaterThan(0);
  });

  it('should generate valid JSON Schema that can be used for validation', () => {
    // This test simulates using the generated schema for validation
    const generator = new SchemaGenerator();

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
        name: 'Type',
        type: 'combobox',
        required: true,
        disabled: false,
        options: ['HTTP'],
      },
      {
        uid: 'ref_3',
        name: 'Path',
        type: 'textbox',
        required: true,
        disabled: false,
      },
    ];

    const metadata: SchemaMetadata = {
      formUrl: 'https://test.com/form',
      resourceType: 'healthcheck',
      extractedAt: '2026-01-21T00:00:00Z',
      version: '1.0.0',
    };

    const input: SchemaGenerationInput = {
      formFields: fields,
      oneOfRelationships: [],
      metadata,
      formUrl: metadata.formUrl,
    };

    const output = generator.generate(input);

    // Schema should be valid
    const validation = generator.validateSchema(output.schema);
    expect(validation.valid).toBe(true);

    // Schema should have required structure
    expect(output.schema.$schema).toBeDefined();
    expect(output.schema.type).toBe('object');
    expect(output.schema.properties).toBeDefined();
    expect(output.schema.required).toContain('name');
    expect(output.schema.required).toContain('type');
    expect(output.schema.required).toContain('path');
  });
});
