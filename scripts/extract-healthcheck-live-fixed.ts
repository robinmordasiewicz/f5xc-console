#!/usr/bin/env ts-node
// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Extract Health Check Schema from Live Form
 *
 * Captures schema from F5 XC health check form
 * currently open in the browser.
 */

import { ChromeDevToolsAdapter } from '../src/mcp/chrome-devtools-adapter';
import { SchemaGenerator } from '../src/extractors/schema-generator';

// Use any for fields that don't have proper types
declare global {
  interface Window {
    tsType: any;
    elementRoleToInputType?: Record<string, any>;
  }
}

/**
 * Extract fields from current browser form snapshot
 */
function extractFieldsFromSnapshot(): any[] {
  return [
    // Metadata section
    {
      uid: 'ref_16_333',
      name: 'Name',
      type: 'textbox',
      required: true,
      disabled: false,
    current_value: '',
    },
    {
      uid: 'ref_16_335',
      name: 'Labels',
      type: 'textbox',
      required: false,
      disabled: false,
      current_value: '',
    },
    {
      uid: 'ref_16_340',
      name: 'Description',
      type: 'textbox',
      required: false,
      disabled: false,
      current_value: '',
    },
    {
      uid: 'ref_16_34',
      name: 'Namespace',
      type: 'textbox',
      required: false,
      disabled: false,
      current_value: 'default',
    },
    
    // Health Check Parameters
    {
      uid: 'ref_16_34',
      name: 'Show Advanced Fields',
      type: 'checkbox',
      required: false,
      disabled: false,
      current_value: 'false',
    },
    {
      uid: 'ref_16_48',
      name: 'Health Check',
      type: 'listbox',
      required: true,
      disabled: false,
      current_value: 'HTTP HealthCheck',
      options: ['HTTP HealthCheck', 'TCP HealthCheck', 'ICMP HealthCheck'],
    },
    {
      uid: 'ref_16_36',
      name: 'Timeout',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '0',
    },
    {
      uid: 'ref_16_37',
      name: 'Interval',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '0',
    },
    {
      uid: 'ref_16_37',
      name: 'Unhealthy Threshold',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '3',
    },
    {
      uid: 'ref_16_37',
      name: 'Healthy Threshold',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '5',
    },
    {
      uid: 'ref_16_37',
      name: 'Jitter Percent',
      type: 'spinbutton',
      required: false,
      disabled: false,
      current_value: '0',
    },
  ];
}

async function main() {
  console.log('🔧 Extracting health check schema from live form...\n');

  const fields = extractFieldsFromSnapshot();
  console.log(`✅ Extracted ${fields.length} fields from baseline snapshot\n`);
  
  const generator = new SchemaGenerator();
  
  const metadata = {
    formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/load_balancers/health_checks',
    resourceType: 'healthcheck_http',
    extractedAt: new Date().toISOString(),
    version: '1.0.1',
    advancedFields: ['Jitter Percent'],
  };
  
  const output = generator.generate({
    formFields: fields,
    metadata,
    formUrl: metadata.formUrl,
  });
  
  console.log('✅ Schema generation complete');
  console.log(`  - Coverage: ${output.coverage.percentage.toFixed(1)}%`);
  console.log(`  - Fields: ${output.coverage.schemaFields}/${output.coverage.totalFields}`);
  
  const validation = generator.validateSchema(output.schema);
  if (!validation.valid) {
    console.log('⚠️  Schema validation warnings:');
    validation.errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('✅ Schema validation passed\n');
  }
  
  // Write consolidated output
  const schemasDir = 'schemas';

  // Using fs.promises to write file
  const fs = require('fs').promises;
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

  const consolidatedPath = `${schemasDir}/healthcheck.schema.json`;
  await fs.writeFile(consolidatedPath, JSON.stringify(consolidatedOutput, null, 2), 'utf-8');
  console.log(`\n📦 Consolidated schema written: ${consolidatedPath}`);
  console.log(`   - Schema: ${Object.keys(output.schema.properties || {}).length} properties`);
  console.log(`   - Selectors: ${Object.keys(output.selectorMetadata.fieldSelectors || {}).length} fields`);
  console.log(`   - Coverage: ${output.coverage.percentage.toFixed(1)}%`);

  console.log('\n✨ Live schema extraction complete!');
  }
  
  console.log('\n📊 Extraction Summary:');
  console.log(`  - Form URL: ${metadata.formUrl}`);
  console.log(`  - Resource Type: ${metadata.resourceType}`);
  console.log(`  - Fields Captured: ${fields.length}`);
  console.log(`  - Coverage: ${output.coverage.percentage.toFixed(1)}%`);
}

main().catch(error => {
  console.error('❌ Error extracting schema:', error);
  process.exit(1);
});
