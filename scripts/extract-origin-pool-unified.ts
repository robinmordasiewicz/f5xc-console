#!/usr/bin/env ts-node
/**
 * Unified Origin Pool Schema Extraction
 *
 * Generates origin_pool schema from declarative definition using PropertyBuilder.
 * Consolidates previously fragmented schema files (mvp, full, api variants).
 * Schema files are ephemeral and regenerated on-demand from the source of truth
 * definition file.
 *
 * Usage:
 *   npx ts-node scripts/extract-origin-pool-unified.ts
 *
 * Source of truth: src/definitions/origin_pool.definition.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { PropertyBuilder } from '../src/extractors/property-builder';
import { originPoolDefinition } from '../src/definitions/origin_pool.definition';

async function main() {
  console.log('🚀 Generating origin_pool schema from unified definition...\n');
  console.log('📋 This consolidates previous fragmented schemas:');
  console.log('   - origin_pool-mvp.schema.json (249 lines)');
  console.log('   - origin_pool-full.schema.json (614 lines)');
  console.log('   - origin_pool-api.schema.json (668 lines)');
  console.log('   - Plus associated selector and report files\n');

  // Use PropertyBuilder to generate schema from definition
  const builder = new PropertyBuilder();
  const output = builder.buildFromDefinition(originPoolDefinition);

  // Add API reference metadata to health_check field
  const healthCheckProp = output.schema.properties.health_check;
  if (healthCheckProp) {
    healthCheckProp['x-f5xc-api'] = {
      isAPIReference: true,
      referencedResourceType: 'healthcheck',
      apiPath: '/api/config/namespaces/{namespace}/healthchecks',
      usesPlaceholder: true, // Until API discovery is implemented
    };
  }

  // Add API reference metadata to tls_certificates field in nested config
  const useTlsConfig = output.schema.properties.use_tls;
  if (useTlsConfig?.properties?.tls_certificates) {
    useTlsConfig.properties.tls_certificates['x-f5xc-api'] = {
      isAPIReference: true,
      referencedResourceType: 'certificate',
      apiPath: '/api/config/namespaces/{namespace}/certificates',
      usesPlaceholder: true,
    };
  }

  // Calculate nested field counts
  const nestedFieldCounts: Record<string, number> = {};
  let totalNestedFields = 0;
  if (originPoolDefinition.nestedConfigs) {
    for (const nc of originPoolDefinition.nestedConfigs) {
      nestedFieldCounts[nc.name] = nc.fields.length;
      totalNestedFields += nc.fields.length;
    }
  }

  // Calculate array field counts
  const arrayFieldCounts: Record<string, number> = {};
  let totalArrayFields = 0;
  if (originPoolDefinition.arrayFields) {
    for (const af of originPoolDefinition.arrayFields) {
      if (af.itemTypes) {
        const itemTypeCount = Object.values(af.itemTypes).reduce((sum, it) => sum + it.fields.length, 0);
        arrayFieldCounts[af.name] = itemTypeCount;
        totalArrayFields += itemTypeCount;
      }
    }
  }

  console.log('📊 Schema Summary:');
  console.log(`   - Top-level fields: ${originPoolDefinition.fields.length}`);
  console.log(`   - Nested configurations: ${originPoolDefinition.nestedConfigs?.length || 0}`);
  for (const [name, count] of Object.entries(nestedFieldCounts)) {
    console.log(`     - ${name}: ${count} fields`);
  }
  console.log(`   - Array fields: ${originPoolDefinition.arrayFields?.length || 0}`);
  for (const [name, count] of Object.entries(arrayFieldCounts)) {
    console.log(`     - ${name}: ${count} fields (across item types)`);
  }
  const totalFields = originPoolDefinition.fields.length + totalNestedFields + totalArrayFields;
  console.log(`   - Total fields: ${totalFields}`);
  console.log(`   - Fields with tooltips: ${Object.keys(originPoolDefinition.tooltipData).length}`);

  // Write output
  const schemasDir = path.resolve(__dirname, '../schemas');
  await fs.mkdir(schemasDir, { recursive: true });

  const outputPath = path.join(schemasDir, 'origin_pool.schema.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n📦 Unified schema written: ${outputPath}`);
  console.log(`   - Schema properties: ${Object.keys(output.schema.properties).length}`);
  console.log(`   - Top-level selectors: ${Object.keys(output.selectors.fieldSelectors).length}`);

  // Count nested selectors
  let nestedSelectorCount = 0;
  if (output.selectors.nestedSelectors) {
    for (const [name, selectors] of Object.entries(output.selectors.nestedSelectors)) {
      const count = Object.keys(selectors as object).length;
      nestedSelectorCount += count;
      console.log(`   - ${name} selectors: ${count}`);
    }
  }

  // Check for origin_servers array
  const originServersSchema = output.schema.properties.origin_servers;
  if (originServersSchema) {
    console.log(`   - origin_servers item types: ${originServersSchema.items?.oneOf?.length || 0}`);
  }

  console.log(`   - Coverage: ${output.metadata.coverage.percentage}%`);
  console.log('\n✨ Unified origin_pool schema generation complete!');

  // Print nested configuration summary
  console.log('\n📝 Nested Configurations:');

  if (output.schema.properties.use_tls?.properties) {
    console.log('\n   TLS Config (enabled when TLS Configuration = "Enable TLS"):');
    for (const [name, prop] of Object.entries(output.schema.properties.use_tls.properties) as [string, any][]) {
      const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
      console.log(`     - ${name}: ${prop.type}${defaultVal}`);
    }
  }

  if (output.schema.properties.ring_hash_config?.properties) {
    console.log('\n   Ring Hash Config (enabled when Load Balancer Algorithm = "Ring Hash"):');
    for (const [name, prop] of Object.entries(output.schema.properties.ring_hash_config.properties) as [string, any][]) {
      const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
      console.log(`     - ${name}: ${prop.type}${defaultVal}`);
    }
  }

  // Print origin_servers array summary
  if (originServersSchema?.items?.oneOf) {
    console.log('\n📝 Origin Servers Array (discriminated by origin_server_type):');
    for (const itemType of originServersSchema.items.oneOf) {
      const typeName = itemType.properties?.origin_server_type?.const;
      const fieldCount = Object.keys(itemType.properties).length - 1; // exclude discriminator
      console.log(`\n   ${typeName}:`);
      for (const [name, prop] of Object.entries(itemType.properties) as [string, any][]) {
        if (name !== 'origin_server_type') {
          const defaultVal = prop.default !== undefined ? ` (default: ${JSON.stringify(prop.default)})` : '';
          console.log(`     - ${name}: ${prop.type}${defaultVal}`);
        }
      }
    }
  }

  // Print sample top-level fields
  console.log('\n📝 Sample top-level fields:');
  const sampleFields = ['port', 'tls_configuration', 'load_balancer_algorithm'];
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

  // Note about old files
  console.log('\n⚠️  Note: The following files can now be removed:');
  const oldFiles = [
    'schemas/origin_pool-mvp.schema.json',
    'schemas/origin_pool-mvp-selectors.json',
    'schemas/origin_pool-mvp-report.json',
    'schemas/origin_pool-full.schema.json',
    'schemas/origin_pool-full-selectors.json',
    'schemas/origin_pool-full-report.json',
    'schemas/origin_pool-api.schema.json',
    'schemas/origin_pool-api-selectors.json',
    'schemas/origin_pool-api-report.json',
  ];
  for (const file of oldFiles) {
    console.log(`   - ${file}`);
  }
  console.log('\n   Run: rm schemas/origin_pool-*.json (except origin_pool.schema.json)');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
