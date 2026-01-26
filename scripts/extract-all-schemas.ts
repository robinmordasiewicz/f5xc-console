#!/usr/bin/env ts-node
/**
 * Unified Schema Extraction Runner
 *
 * Generates all resource schemas from declarative definitions using PropertyBuilder.
 * This consolidates schema generation for all supported F5 XC resource types.
 *
 * Usage:
 *   npx ts-node scripts/extract-all-schemas.ts
 *   npx ts-node scripts/extract-all-schemas.ts --dry-run  # Check what would change
 *
 * Source of truth:
 *   - src/definitions/index.ts (exports ALL_DEFINITIONS)
 *
 * Supported resources (10):
 *   Original: healthcheck, origin_pool, app_firewall, service_policy
 *   API Security: api_definition, api_discovery, api_groups,
 *                 code_base_integration, data_type, sensitive_data_policy
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { PropertyBuilder, PropertyBuilderOptions } from '../src/extractors/property-builder';
import { ALL_DEFINITIONS } from '../src/definitions';
import type { ResourceDefinition } from '../src/extractors/resource-definition';

// Use deterministic output for idempotent schema generation
const BUILD_OPTIONS: PropertyBuilderOptions = {
  deterministic: true,
};

interface ExtractionResult {
  resourceType: string;
  success: boolean;
  fieldsCount: number;
  coverage: number;
  changed: boolean;
  error?: string;
}

// Use centralized definitions from index.ts
const definitions: ResourceDefinition[] = ALL_DEFINITIONS;

async function extractSchema(
  definition: ResourceDefinition,
  dryRun: boolean = false
): Promise<ExtractionResult> {
  const resourceType = definition.resourceType;

  try {
    const builder = new PropertyBuilder();
    const output = builder.buildFromDefinition(definition, BUILD_OPTIONS);

    // Prepare output
    const schemasDir = path.resolve(__dirname, '../schemas');
    await fs.mkdir(schemasDir, { recursive: true });

    const outputPath = path.join(schemasDir, `${resourceType}.schema.json`);
    const newContent = JSON.stringify(output, null, 2);

    // Check if content changed (idempotency tracking)
    let existingContent = '';
    let changed = true;
    try {
      existingContent = await fs.readFile(outputPath, 'utf-8');
      changed = existingContent !== newContent;
    } catch {
      // File doesn't exist, will be created
      changed = true;
    }

    // Write schema to file (unless dry-run)
    if (!dryRun) {
      await fs.writeFile(outputPath, newContent, 'utf-8');
    }

    return {
      resourceType,
      success: true,
      fieldsCount: output.metadata.coverage.totalFields,
      coverage: output.metadata.coverage.percentage,
      changed,
    };
  } catch (error) {
    return {
      resourceType,
      success: false,
      fieldsCount: 0,
      coverage: 0,
      changed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🚀 Unified Schema Extraction Runner\n');
  if (dryRun) {
    console.log('   [DRY RUN MODE - No files will be written]\n');
  }
  console.log(`   Processing ${definitions.length} resource definitions...\n`);

  const results: ExtractionResult[] = [];

  for (const definition of definitions) {
    process.stdout.write(`   ${definition.resourceType}... `);
    const result = await extractSchema(definition, dryRun);
    results.push(result);

    if (result.success) {
      const changeStatus = result.changed ? '(changed)' : '(unchanged)';
      console.log(`✅ ${result.fieldsCount} fields, ${result.coverage}% coverage ${changeStatus}`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log('   ──────────────────────────────────────────────────────────');
  console.log('   Resource Type          │ Fields │ Coverage │ Status │ Changed');
  console.log('   ──────────────────────────────────────────────────────────');

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const changed = result.success ? (result.changed ? '🔄' : '─') : '─';
    const fields = result.fieldsCount.toString().padStart(6);
    const coverage = `${result.coverage}%`.padStart(8);
    const name = result.resourceType.padEnd(22);
    console.log(`   ${name} │ ${fields} │ ${coverage} │   ${status}   │    ${changed}`);
  }

  console.log('   ──────────────────────────────────────────────────────────');

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const changedCount = results.filter(r => r.success && r.changed).length;
  const unchangedCount = results.filter(r => r.success && !r.changed).length;

  console.log(`\n   Total: ${successCount} succeeded, ${failCount} failed`);
  console.log(`          ${changedCount} changed, ${unchangedCount} unchanged`);

  // Exit with error if any failed
  if (failCount > 0) {
    console.log('\n❌ Some schemas failed to generate');
    process.exit(1);
  }

  if (dryRun) {
    console.log('\n📝 Dry run complete - no files were modified');
  } else {
    console.log('\n✨ All schemas generated successfully!');
  }

  console.log('\n   Output files:');
  for (const result of results) {
    const marker = result.changed ? '🔄' : ' ';
    console.log(`   ${marker} schemas/${result.resourceType}.schema.json`);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
