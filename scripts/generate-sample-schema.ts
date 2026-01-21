#!/usr/bin/env ts-node
// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Generate Sample Health Check Schema
 *
 * Creates a comprehensive healthcheck.schema.json to demonstrate the extraction system.
 * This script simulates what would be generated from the actual form extraction.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SchemaGenerator } from '../src/extractors/schema-generator';
import { OneOfDetector } from '../src/extractors/oneof-detector';
import { DetectedFormField } from '../src/handlers/form-handler';
import { SchemaMetadata } from '../src/types/schema-extractor';

async function main() {
  console.log('🔧 Generating sample health check schema...\n');

  // Simulate detected form fields (maximum expanded state with HTTP selected)
  const allFields: DetectedFormField[] = [
    {
      uid: 'ref_1',
      name: 'Name',
      type: 'textbox',
      required: true,
      disabled: false,
      placeholder: 'healthcheck-name',
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
      name: 'Health Check Type',
      type: 'combobox',
      required: true,
      disabled: false,
      options: ['HTTP', 'TCP', 'ICMP'],
      current_value: 'HTTP',
    },
    {
      uid: 'ref_4',
      name: 'Timeout',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '10',
    },
    {
      uid: 'ref_5',
      name: 'Interval',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '5',
    },
    {
      uid: 'ref_6',
      name: 'Unhealthy Threshold',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '3',
    },
    {
      uid: 'ref_7',
      name: 'Healthy Threshold',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '2',
    },
    {
      uid: 'ref_8',
      name: 'Jitter Percent',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '0',
    },
    // HTTP-specific fields
    {
      uid: 'ref_9',
      name: 'Path',
      type: 'textbox',
      required: true,
      disabled: false,
      placeholder: '/health',
    },
    {
      uid: 'ref_10',
      name: 'Use HTTP2',
      type: 'checkbox',
      required: false,
      disabled: false,
      current_value: 'false',
    },
    {
      uid: 'ref_11',
      name: 'Host Header',
      type: 'combobox',
      required: false,
      disabled: false,
      options: ['Origin Server Name', 'Custom Value'],
      current_value: 'Origin Server Name',
    },
    {
      uid: 'ref_12',
      name: 'Custom Value',
      type: 'textbox',
      required: true,
      disabled: false,
    },
    // TCP-specific fields
    {
      uid: 'ref_13',
      name: 'Port',
      type: 'spinbutton',
      required: true,
      disabled: false,
      current_value: '80',
    },
  ];

  // Simulate oneOf detection
  const detector = new OneOfDetector();

  // Common fields for all types
  const commonFields = allFields.slice(0, 8);

  // HTTP state
  const httpFields = [...commonFields, ...allFields.slice(8, 12)];
  detector.recordFieldState('Health Check Type', 'HTTP', httpFields);

  // TCP state
  const tcpFields = [...commonFields, allFields[12]]; // Port field
  detector.recordFieldState('Health Check Type', 'TCP', tcpFields);

  // ICMP state (no exclusive fields)
  detector.recordFieldState('Health Check Type', 'ICMP', commonFields);

  // Host Header oneOf (nested within HTTP)
  const httpOriginFields = httpFields.filter(f => f.name !== 'Custom Value');
  detector.recordFieldState('Host Header', 'Origin Server Name', httpOriginFields);

  const httpCustomFields = httpFields; // Includes Custom Value
  detector.recordFieldState('Host Header', 'Custom Value', httpCustomFields);

  // Analyze relationships
  const oneOfAnalysis = detector.analyzeRelationships();

  console.log('✓ OneOf detection complete');
  console.log(`  - ${oneOfAnalysis.relationships.length} relationships detected`);
  console.log(`  - Confidence: ${(oneOfAnalysis.confidence * 100).toFixed(1)}%`);
  console.log(`  - Mutations: ${oneOfAnalysis.mutations.length}\n`);

  // Generate schema
  const generator = new SchemaGenerator();

  const metadata: SchemaMetadata = {
    formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/namespaces/*/manage/health_checks/create',
    resourceType: 'healthcheck',
    extractedAt: new Date().toISOString(),
    version: '1.0.0',
    advancedFields: ['Jitter Percent'],
    warnings: [
      'This schema was generated from simulated form data for demonstration purposes',
      'Actual form extraction may reveal additional fields or relationships',
    ],
  };

  const output = generator.generate({
    formFields: httpFields, // Use HTTP as baseline (most complete)
    oneOfRelationships: oneOfAnalysis.relationships,
    metadata,
    formUrl: metadata.formUrl,
  });

  console.log('✓ Schema generation complete');
  console.log(`  - Coverage: ${output.coverage.percentage.toFixed(1)}%`);
  console.log(`  - Fields: ${output.coverage.schemaFields}/${output.coverage.totalFields}`);
  console.log(`  - Warnings: ${output.warnings.length}\n`);

  // Validate schema
  const validation = generator.validateSchema(output.schema);
  if (!validation.valid) {
    console.log('⚠️  Schema validation warnings:');
    validation.errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('✓ Schema validation passed\n');
  }

  // Ensure output directories exist
  const schemasDir = path.join(process.cwd(), 'schemas');
  const metadataDir = path.join(process.cwd(), 'metadata');

  await fs.mkdir(schemasDir, { recursive: true });
  await fs.mkdir(metadataDir, { recursive: true });

  // Write schema
  const schemaPath = path.join(schemasDir, 'healthcheck.schema.json');
  await fs.writeFile(
    schemaPath,
    JSON.stringify(output.schema, null, 2),
    'utf-8'
  );
  console.log(`📄 Schema written: ${schemaPath}`);

  // Write selector metadata
  const selectorPath = path.join(metadataDir, 'healthcheck-selectors.json');
  await fs.writeFile(
    selectorPath,
    JSON.stringify(output.selectorMetadata, null, 2),
    'utf-8'
  );
  console.log(`🎯 Selectors written: ${selectorPath}`);

  // Write warnings if any
  if (output.warnings.length > 0) {
    const warningsPath = path.join(metadataDir, 'healthcheck-warnings.json');
    await fs.writeFile(
      warningsPath,
      JSON.stringify({ warnings: output.warnings }, null, 2),
      'utf-8'
    );
    console.log(`⚠️  Warnings written: ${warningsPath}`);
  }

  console.log('\n✨ Sample schema generation complete!');
  console.log('\nGenerated files:');
  console.log(`  - ${schemaPath}`);
  console.log(`  - ${selectorPath}`);
  if (output.warnings.length > 0) {
    console.log(`  - ${path.join(metadataDir, 'healthcheck-warnings.json')}`);
  }
}

main().catch(error => {
  console.error('❌ Error generating schema:', error);
  process.exit(1);
});
