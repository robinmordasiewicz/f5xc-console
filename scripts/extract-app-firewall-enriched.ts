#!/usr/bin/env ts-node
/**
 * Enriched App Firewall Schema Extraction
 *
 * Generates app_firewall schema from declarative definition using PropertyBuilder.
 * Schema files are ephemeral and regenerated on-demand from the source of truth
 * definition file.
 *
 * Usage:
 *   npx ts-node scripts/extract-app-firewall-enriched.ts
 *
 * Source of truth: src/definitions/app_firewall.definition.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { PropertyBuilder } from '../src/extractors/property-builder';
import { appFirewallDefinition } from '../src/definitions/app_firewall.definition';

async function main() {
  console.log('🚀 Generating app_firewall schema from definition...\n');

  // Use PropertyBuilder to generate schema from definition
  const builder = new PropertyBuilder();
  const output = builder.buildFromDefinition(appFirewallDefinition);

  // Add enforcement mode descriptions to the discriminator field
  const enforcementModeProp = output.schema.properties.enforcement_mode;
  if (enforcementModeProp && appFirewallDefinition.fields.find(f => f.name === 'enforcement_mode')?.enumDescriptions) {
    enforcementModeProp['x-f5xc-type-descriptions'] = appFirewallDefinition.fields.find(f => f.name === 'enforcement_mode')?.enumDescriptions;
  }

  // Add detection settings descriptions
  const detectionSettingsProp = output.schema.properties.detection_settings;
  if (detectionSettingsProp && appFirewallDefinition.fields.find(f => f.name === 'detection_settings')?.enumDescriptions) {
    detectionSettingsProp['x-f5xc-type-descriptions'] = appFirewallDefinition.fields.find(f => f.name === 'detection_settings')?.enumDescriptions;
  }

  // Add blocking page descriptions
  const blockingPageProp = output.schema.properties.blocking_page;
  if (blockingPageProp && appFirewallDefinition.fields.find(f => f.name === 'blocking_page')?.enumDescriptions) {
    blockingPageProp['x-f5xc-type-descriptions'] = appFirewallDefinition.fields.find(f => f.name === 'blocking_page')?.enumDescriptions;
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

  const outputPath = path.join(schemasDir, 'app_firewall.schema.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n📦 Schema written: ${outputPath}`);
  console.log(`   - Schema properties: ${Object.keys(output.schema.properties).length}`);
  console.log(`   - Top-level selectors: ${Object.keys(output.selectors.fieldSelectors).length}`);

  // Count nested selectors
  let customDetectionNestedCount = 0;
  let customBlockingNestedCount = 0;
  let customBotNestedCount = 0;
  if (output.selectors.nestedSelectors) {
    customDetectionNestedCount = Object.keys(output.selectors.nestedSelectors.custom_detection_settings_config || {}).length;
    customBlockingNestedCount = Object.keys(output.selectors.nestedSelectors.custom_blocking_page_config || {}).length;
    customBotNestedCount = Object.keys(output.selectors.nestedSelectors.custom_bot_settings_config || {}).length;
  }
  console.log(`   - Custom Detection nested selectors: ${customDetectionNestedCount}`);
  console.log(`   - Custom Blocking Page nested selectors: ${customBlockingNestedCount}`);
  console.log(`   - Custom Bot Settings nested selectors: ${customBotNestedCount}`);
  console.log(`   - oneOf discriminators: ${output.schema.oneOf?.length || 0}`);
  console.log(`   - Coverage: ${output.metadata.coverage.percentage}%`);

  console.log('\n✨ Schema generation complete!');

  // Print nested configuration summary
  console.log('\n📝 Nested Configurations:');

  console.log('\n   Custom Detection Settings Config:');
  const detectionConfig = output.schema.properties.custom_detection_settings_config;
  if (detectionConfig?.properties) {
    for (const [name, prop] of Object.entries(detectionConfig.properties) as [string, any][]) {
      const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
      console.log(`     - ${name}: ${prop.type}${defaultVal}`);
    }
  }

  console.log('\n   Custom Blocking Page Config:');
  const blockingConfig = output.schema.properties.custom_blocking_page_config;
  if (blockingConfig?.properties) {
    for (const [name, prop] of Object.entries(blockingConfig.properties) as [string, any][]) {
      const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
      console.log(`     - ${name}: ${prop.type}${defaultVal}`);
    }
  }

  console.log('\n   Custom Bot Settings Config:');
  const botConfig = output.schema.properties.custom_bot_settings_config;
  if (botConfig?.properties) {
    for (const [name, prop] of Object.entries(botConfig.properties) as [string, any][]) {
      const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
      console.log(`     - ${name}: ${prop.type}${defaultVal}`);
    }
  }

  // Print sample of top-level fields
  console.log('\n📝 Sample top-level fields:');
  const sampleFields = ['enforcement_mode', 'detection_settings', 'blocking_page'];
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

  // Verification output for success criteria
  console.log('\n📋 Verification:');
  console.log(`   - Resource type: ${output.metadata.resourceType}`);
  console.log(`   - Has selectors: ${!!output.selectors}`);
  console.log(`   - Has metadata: ${!!output.metadata}`);
  console.log(`   - Schema $id: ${output.schema.$id || 'N/A'}`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
