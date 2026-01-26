#!/usr/bin/env ts-node
/**
 * Enriched Healthcheck Schema Extraction
 *
 * Generates healthcheck schema from declarative definition using PropertyBuilder.
 * Schema files are ephemeral and regenerated on-demand from the source of truth
 * definition file.
 *
 * Usage:
 *   npx ts-node scripts/extract-healthcheck-enriched.ts
 *
 * Source of truth: src/definitions/healthcheck.definition.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { PropertyBuilder } from '../src/extractors/property-builder';
import { healthcheckDefinition } from '../src/definitions/healthcheck.definition';

async function main() {
  console.log('🚀 Generating healthcheck schema from definition...\n');

  // Use PropertyBuilder to generate schema from definition
  const builder = new PropertyBuilder();
  const output = builder.buildFromDefinition(healthcheckDefinition);

  // Add health check type descriptions to the discriminator field
  const healthCheckProp = output.schema.properties.health_check;
  if (healthCheckProp && healthcheckDefinition.fields.find(f => f.name === 'health_check')?.enumDescriptions) {
    healthCheckProp['x-f5xc-type-descriptions'] = healthcheckDefinition.fields.find(f => f.name === 'health_check')?.enumDescriptions;
  }

  console.log('📊 Schema Summary:');
  console.log(`   - Top-level fields: ${output.metadata.coverage.topLevelFields}`);
  console.log(`   - Nested fields: ${output.metadata.coverage.nestedFields}`);
  console.log(`   - Total fields: ${output.metadata.coverage.totalFields}`);
  console.log(`   - Nested configurations: ${output.metadata.coverage.nestedConfigurations}`);
  console.log(`   - Fields with tooltips: ${output.metadata.coverage.fieldsWithTooltips}`);
  console.log(`   - Fields with defaults: ${output.metadata.coverage.fieldsWithDefaults}`);

  // Write output
  const schemasDir = path.resolve(__dirname, '../schemas');
  await fs.mkdir(schemasDir, { recursive: true });

  const outputPath = path.join(schemasDir, 'healthcheck.schema.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n📦 Schema written: ${outputPath}`);
  console.log(`   - Schema properties: ${Object.keys(output.schema.properties).length}`);
  console.log(`   - Top-level selectors: ${Object.keys(output.selectors.fieldSelectors).length}`);

  // Count nested selectors
  let httpNestedCount = 0;
  let tcpNestedCount = 0;
  if (output.selectors.nestedSelectors) {
    httpNestedCount = Object.keys(output.selectors.nestedSelectors.http_health_check_config || {}).length;
    tcpNestedCount = Object.keys(output.selectors.nestedSelectors.tcp_health_check_config || {}).length;
  }
  console.log(`   - HTTP nested selectors: ${httpNestedCount}`);
  console.log(`   - TCP nested selectors: ${tcpNestedCount}`);
  console.log(`   - oneOf discriminators: ${output.schema.oneOf?.length || 0}`);
  console.log(`   - Coverage: ${output.metadata.coverage.percentage}%`);

  console.log('\n✨ Schema generation complete!');

  // Print nested configuration summary
  console.log('\n📝 Nested Configurations:');

  console.log('\n   HTTP HealthCheck Config:');
  const httpConfig = output.schema.properties.http_health_check_config;
  if (httpConfig?.properties) {
    for (const [name, prop] of Object.entries(httpConfig.properties) as [string, any][]) {
      const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
      console.log(`     - ${name}: ${prop.type}${defaultVal}`);
    }
  }

  console.log('\n   TCP HealthCheck Config:');
  const tcpConfig = output.schema.properties.tcp_health_check_config;
  if (tcpConfig?.properties) {
    for (const [name, prop] of Object.entries(tcpConfig.properties) as [string, any][]) {
      const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
      console.log(`     - ${name}: ${prop.type}${defaultVal}`);
    }
  }

  // Print sample of top-level fields
  console.log('\n📝 Sample top-level fields:');
  const sampleFields = ['health_check', 'timeout', 'interval'];
  for (const fieldName of sampleFields) {
    const prop = output.schema.properties[fieldName];
    if (prop) {
      console.log(`\n   ${fieldName}:`);
      console.log(`     Type: ${prop.type}`);
      if (prop.enum) {
        console.log(`     Options: ${prop.enum.join(', ')}`);
      }
      if (prop.default !== undefined) {
        console.log(`     Default: ${prop.default}`);
      }
    }
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
