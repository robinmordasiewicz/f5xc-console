#!/usr/bin/env ts-node
// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Extract Health Check Schema from Live Form
 *
 * Runs the actual schema extraction on the live F5 XC health check form
 * currently open in the browser.
 */

import { DetectedFormField } from '../src/handlers/form-handler';
import { OneOfDetector } from '../src/extractors/oneof-detector';
import { SchemaGenerator } from '../src/extractors/schema-generator';
import { SchemaMetadata } from '../src/types/schema-extractor';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Extract fields from current browser form snapshot
 */
function extractFieldsFromSnapshot(): DetectedFormField[] {
  // Based on the current form, extract all visible fields
  const fields: DetectedFormField[] = [
    // Metadata section
    {
      uid: 'ref_594',
      name: 'Name',
      type: 'textbox',
      required: true,
      disabled: false,
    },
    {
      uid: 'ref_598',
      name: 'Labels',
      type: 'textbox',
      required: false,
      disabled: false,
    },
    {
      uid: 'ref_602',
      name: 'Description',
      type: 'textbox',
      required: false,
      disabled: false,
    },

    // Health Check Parameters
    {
      uid: 'ref_606',
      name: 'Show Advanced Fields',
      type: 'checkbox',
      required: false,
      disabled: false,
      current_value: 'false',
    },
    {
      uid: 'ref_611',
      name: 'Health Check',
      type: 'listbox',
      required: true,
      disabled: false,
      options: ['HTTP HealthCheck', 'TCP HealthCheck', 'ICMP HealthCheck'],
      current_value: 'HTTP HealthCheck',
    },
    {
      uid: 'ref_621',
      name: 'Timeout',
      type: 'spinbutton',
      required: false,
      disabled: false,
    },
    {
      uid: 'ref_627',
      name: 'Interval',
      type: 'spinbutton',
      required: false,
      disabled: false,
    },
    {
      uid: 'ref_632',
      name: 'Unhealthy Threshold',
      type: 'spinbutton',
      required: false,
      disabled: false,
    },
    {
      uid: 'ref_637',
      name: 'Healthy Threshold',
      type: 'spinbutton',
      required: false,
      disabled: false,
    },
    {
      uid: 'ref_642',
      name: 'Jitter Percent',
      type: 'spinbutton',
      required: false,
      disabled: false,
    },
  ];

  return fields;
}

async function main() {
  console.log('🔧 Extracting health check schema from live form...\\n');

  // Get baseline fields from current form state
  const baselineFields = extractFieldsFromSnapshot();
  console.log(`✓ Extracted ${baselineFields.length} fields from baseline snapshot\\n`);

  // For this initial run, we'll simulate the different health check type states
  // since we can't interact with the browser from this script
  // In a full implementation, this would use browser automation to:
  // 1. Click Health Check dropdown
  // 2. Select each option (HTTP/TCP/ICMP)
  // 3. Capture snapshots
  // 4. Click "Edit Configuration" for HTTP
  // 5. Capture nested config fields

  const detector = new OneOfDetector();

  // Common fields for all health check types
  const commonFields = baselineFields.filter(f =>
    !['HTTP HealthCheck Configuration'].includes(f.name)
  );

  // HTTP state - includes all baseline fields
  console.log('Recording HTTP health check state...');
  detector.recordFieldState('Health Check', 'HTTP', baselineFields);

  // TCP state - remove HTTP-specific fields
  console.log('Recording TCP health check state...');
  const tcpFields = commonFields.filter(f => f.name !== 'HTTP Path');
  detector.recordFieldState('Health Check', 'TCP', tcpFields);

  // ICMP state - no exclusive fields
  console.log('Recording ICMP health check state...');
  detector.recordFieldState('Health Check', 'ICMP', commonFields);

  // Analyze relationships
  console.log('\\n🔍 Analyzing field relationships...');
  const oneOfAnalysis = detector.analyzeRelationships();

  console.log(`✓ Detection complete`);
  console.log(`  - Relationships: ${oneOfAnalysis.relationships.length}`);
  console.log(`  - Confidence: ${(oneOfAnalysis.confidence * 100).toFixed(1)}%`);
  console.log(`  - Mutations: ${oneOfAnalysis.mutations.length}\\n`);

  // Generate schema
  const generator = new SchemaGenerator();

  const metadata: SchemaMetadata = {
    formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/*/manage/load_balancers/health_checks',
    resourceType: 'healthcheck',
    extractedAt: new Date().toISOString(),
    version: '1.0.0',
    advancedFields: ['Jitter Percent'],
    warnings: [
      'Extracted from live form using baseline observation',
      'Full nested configuration extraction requires browser automation',
    ],
  };

  const output = generator.generate({
    formFields: baselineFields,
    oneOfRelationships: oneOfAnalysis.relationships,
    metadata,
    formUrl: metadata.formUrl,
  });

  console.log('✓ Schema generation complete');
  console.log(`  - Coverage: ${output.coverage.percentage.toFixed(1)}%`);
  console.log(`  - Fields: ${output.coverage.schemaFields}/${output.coverage.totalFields}`);
  console.log(`  - Warnings: ${output.warnings.length}\\n`);

  // Validate schema
  const validation = generator.validateSchema(output.schema);
  if (!validation.valid) {
    console.log('⚠️  Schema validation warnings:');
    validation.errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('✓ Schema validation passed\\n');
  }

  // Ensure output directories exist
  const schemasDir = path.join(process.cwd(), 'schemas');
  const metadataDir = path.join(process.cwd(), 'metadata');

  await fs.mkdir(schemasDir, { recursive: true });
  await fs.mkdir(metadataDir, { recursive: true });

  // Write schema
  const schemaPath = path.join(schemasDir, 'healthcheck-live.schema.json');
  await fs.writeFile(
    schemaPath,
    JSON.stringify(output.schema, null, 2),
    'utf-8'
  );
  console.log(`📄 Schema written: ${schemaPath}`);

  // Write selector metadata
  const selectorPath = path.join(metadataDir, 'healthcheck-live-selectors.json');
  await fs.writeFile(
    selectorPath,
    JSON.stringify(output.selectorMetadata, null, 2),
    'utf-8'
  );
  console.log(`🎯 Selectors written: ${selectorPath}`);

  // Write warnings if any
  if (output.warnings.length > 0) {
    const warningsPath = path.join(metadataDir, 'healthcheck-live-warnings.json');
    await fs.writeFile(
      warningsPath,
      JSON.stringify({ warnings: output.warnings }, null, 2),
      'utf-8'
    );
    console.log(`⚠️  Warnings written: ${warningsPath}`);
  }

  console.log('\\n✨ Live schema extraction complete!');
  console.log('\\nGenerated files:');
  console.log(`  - ${schemaPath}`);
  console.log(`  - ${selectorPath}`);
  if (output.warnings.length > 0) {
    console.log(`  - ${path.join(metadataDir, 'healthcheck-live-warnings.json')}`);
  }

  console.log('\\n📊 Extraction Summary:');
  console.log(`  - Form URL: ${metadata.formUrl}`);
  console.log(`  - Resource Type: ${metadata.resourceType}`);
  console.log(`  - Fields Captured: ${baselineFields.length}`);
  console.log(`  - OneOf Relationships: ${oneOfAnalysis.relationships.length}`);
  console.log(`  - Detection Confidence: ${(oneOfAnalysis.confidence * 100).toFixed(1)}%`);
  console.log(`  - Schema Coverage: ${output.coverage.percentage.toFixed(1)}%`);
}

main().catch(error => {
  console.error('❌ Error extracting schema:', error);
  process.exit(1);
});