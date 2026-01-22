#!/usr/bin/env ts-node
// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Simple Health Check Schema Extraction from Live Form
 */

import { SchemaGenerator } from '../src/extractors/schema-generator';
import { SchemaMetadata } from '../src/types/schema-extractor';
import { DetectedFormField } from '../src/handlers/form-handler';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  console.log('🔧 Extracting health check schema from live form...\n');

  // Form fields from the currently open healthcheck form
  const fields: DetectedFormField[] = [
    // Metadata section
    {
      uid: 'ref_10_168',
      name: 'Name',
      type: 'textbox',
      required: true,
      disabled: false,
    },
    {
      uid: 'ref_10_171',
      name: 'Labels',
      type: 'textbox',
      required: false,
      disabled: false,
    },
    {
      uid: 'ref_10_174',
      name: 'Description',
      type: 'textbox',
      required: false,
      disabled: false,
    },

    // Health Check Parameters
    {
      uid: 'ref_10_177',
      name: 'Show Advanced Fields',
      type: 'checkbox',
      required: false,
      disabled: false,
    },
    {
      uid: 'ref_10_181',
      name: 'Health Check',
      type: 'listbox',
      required: true,
      disabled: false,
      options: ['HTTP HealthCheck', 'TCP HealthCheck', 'ICMP HealthCheck'],
      current_value: 'HTTP HealthCheck',
    },
    {
      uid: 'ref_10_191',
      name: 'Timeout',
      type: 'spinbutton',
      required: true,
      disabled: false,
      current_value: '3',
    },
    {
      uid: 'ref_10_196',
      name: 'Interval',
      type: 'spinbutton',
      required: true,
      disabled: false,
      current_value: '15',
    },
    {
      uid: 'ref_10_200',
      name: 'Unhealthy Threshold',
      type: 'spinbutton',
      required: true,
      disabled: false,
      current_value: '1',
    },
    {
      uid: 'ref_10_204',
      name: 'Healthy Threshold',
      type: 'spinbutton',
      required: true,
      disabled: false,
      current_value: '3',
    },
  ];

  console.log(`✅ Extracted ${fields.length} fields from form\n`);

  const generator = new SchemaGenerator();

  // Load field mappings
  const mappingsPath = path.resolve(__dirname, '../config/field-mappings.yaml');
  generator.loadFieldMappingsSync(mappingsPath);

  const metadata: SchemaMetadata = {
    formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/load_balancers/health_checks',
    resourceType: 'healthcheck',
    extractedAt: new Date().toISOString(),
    version: '1.0.0',
    extractionVersion: '1.0',
    advancedFields: [],
  };

  const output = await generator.generate({
    formFields: fields,
    oneOfRelationships: [],
    metadata,
    formUrl: metadata.formUrl,
  });

  console.log('✅ Schema generation complete');
  console.log(`  - Coverage: ${output.coverage.percentage.toFixed(1)}%`);
  console.log(`  - Fields: ${output.coverage.schemaFields}/${output.coverage.totalFields}`);

  if (output.warnings.length > 0) {
    console.log('  ⚠️  Warnings:');
    output.warnings.forEach(w => console.log(`     - ${w}`));
  }

  // Write consolidated output
  const schemasDir = path.resolve(__dirname, '../schemas');
  await fs.mkdir(schemasDir, { recursive: true });

  const consolidatedOutput = {
    schema: output.schema,
    selectors: output.selectorMetadata,
    metadata: {
      ...metadata,
      coverage: output.coverage,
      warnings: output.warnings,
    },
  };

  const consolidatedPath = path.join(schemasDir, 'healthcheck.schema.json');
  await fs.writeFile(consolidatedPath, JSON.stringify(consolidatedOutput, null, 2), 'utf-8');
  console.log(`\n📦 Consolidated schema written: ${consolidatedPath}`);
  console.log(`   - Schema: ${Object.keys(output.schema.properties || {}).length} properties`);
  console.log(`   - Selectors: ${Object.keys(output.selectorMetadata.fieldSelectors || {}).length} fields`);
  console.log(`   - Coverage: ${output.coverage.percentage.toFixed(1)}%`);

  console.log('\n✨ Live schema extraction complete!');
}

main().catch(error => {
  console.error('❌ Error extracting schema:', error);
  process.exit(1);
});
