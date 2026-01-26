#!/usr/bin/env ts-node
// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Automated Schema Extraction Script
 *
 * Idempotent, programmatic extraction of JSON schemas from F5 XC Console forms.
 * Uses Chrome automation to systematically explore forms and detect field relationships.
 */

import { SnapshotParser, ParsedSnapshot } from '../src/mcp/snapshot-parser';
import { FormHandler, DetectedFormField } from '../src/handlers/form-handler';
import { OneOfDetector } from '../src/extractors/oneof-detector';
import { SchemaGenerator } from '../src/extractors/schema-generator';
import { SchemaMetadata, FormStateSnapshot } from '../src/types/schema-extractor';
import * as fs from 'fs/promises';
import * as path from 'path';

interface BrowserTools {
  tabId: number;
  readPage(): Promise<string>;
  click(ref: string, description: string): Promise<void>;
  selectOption(ref: string, option: string): Promise<void>;
  wait(ms: number): Promise<void>;
}

/**
 * Form exploration state machine
 */
class FormExplorer {
  private formHandler: FormHandler;
  private detector: OneOfDetector;
  private capturedStates: Map<string, DetectedFormField[]> = new Map();

  constructor() {
    this.formHandler = new FormHandler();
    this.detector = new OneOfDetector();
  }

  /**
   * Capture current form state from accessibility tree
   */
  async captureState(snapshotText: string, stateId: string): Promise<DetectedFormField[]> {
    const parser = new SnapshotParser();
    const snapshot = parser.parseSnapshot(snapshotText);
    const fields = this.formHandler.detectFormFields(snapshot);

    this.capturedStates.set(stateId, fields);
    console.log(`  📸 Captured ${fields.length} fields for state: ${stateId}`);

    return fields;
  }

  /**
   * Find all dropdown/listbox fields in current state
   */
  findControlFields(fields: DetectedFormField[]): DetectedFormField[] {
    return fields.filter(f =>
      f.type === 'combobox' ||
      f.type === 'listbox' ||
      f.type === 'select'
    );
  }

  /**
   * Find all toggle/checkbox fields
   */
  findToggleFields(fields: DetectedFormField[]): DetectedFormField[] {
    return fields.filter(f => f.type === 'checkbox' || f.type === 'switch');
  }

  /**
   * Record field state for oneOf detection
   */
  recordState(controlField: string, optionValue: string, fields: DetectedFormField[]) {
    this.detector.recordFieldState(controlField, optionValue, fields);
  }

  /**
   * Analyze all recorded states and return relationships
   */
  analyze() {
    return this.detector.analyzeRelationships();
  }

  /**
   * Get all captured states
   */
  getStates(): Map<string, DetectedFormField[]> {
    return this.capturedStates;
  }
}

/**
 * Automated form extraction workflow
 */
async function extractFormSchema(
  browser: BrowserTools,
  formUrl: string,
  resourceType: string
): Promise<void> {
  console.log(`🤖 Starting automated extraction for: ${resourceType}\n`);

  const explorer = new FormExplorer();

  // Step 1: Capture baseline state
  console.log('📋 Step 1: Capturing baseline state...');
  const baselineSnapshot = await browser.readPage();
  const baselineFields = await explorer.captureState(baselineSnapshot, 'baseline');

  // Step 2: Find all control fields (dropdowns, toggles)
  console.log('\n🎛️  Step 2: Identifying control fields...');
  const dropdowns = explorer.findControlFields(baselineFields);
  const toggles = explorer.findToggleFields(baselineFields);

  console.log(`  - Found ${dropdowns.length} dropdown/listbox controls`);
  console.log(`  - Found ${toggles.length} toggle/checkbox controls`);

  // Step 3: Systematically explore dropdown options
  console.log('\n🔍 Step 3: Exploring dropdown states...');
  for (const dropdown of dropdowns) {
    if (!dropdown.options || dropdown.options.length === 0) continue;

    console.log(`\n  Testing: ${dropdown.name}`);
    console.log(`    Options: ${dropdown.options.join(', ')}`);

    for (const option of dropdown.options) {
      console.log(`    → Selecting: ${option}`);

      try {
        // Click dropdown and select option
        await browser.click(dropdown.uid, `${dropdown.name} dropdown`);
        await browser.wait(300);

        // Find and click option (this would need proper option selector logic)
        // For now, we'll simulate by recording current state
        const snapshot = await browser.readPage();
        const fields = await explorer.captureState(snapshot, `${dropdown.name}:${option}`);

        // Record for oneOf detection
        explorer.recordState(dropdown.name, option, fields);

        await browser.wait(200);
      } catch (error) {
        console.log(`    ⚠️  Could not select ${option}: ${error}`);
      }
    }
  }

  // Step 4: Test toggle states
  console.log('\n🔘 Step 4: Testing toggle states...');
  for (const toggle of toggles) {
    console.log(`\n  Testing: ${toggle.name}`);

    // Capture OFF state
    const offSnapshot = await browser.readPage();
    const offFields = await explorer.captureState(offSnapshot, `${toggle.name}:off`);

    // Click to toggle ON
    try {
      await browser.click(toggle.uid, `${toggle.name} toggle`);
      await browser.wait(500);

      const onSnapshot = await browser.readPage();
      const onFields = await explorer.captureState(onSnapshot, `${toggle.name}:on`);

      // Compare to detect mutations
      const fieldsAppeared = onFields.filter(f =>
        !offFields.find(off => off.name === f.name)
      );
      const fieldsDisappeared = offFields.filter(f =>
        !onFields.find(on => on.name === f.name)
      );

      if (fieldsAppeared.length > 0 || fieldsDisappeared.length > 0) {
        console.log(`    ✓ Mutation detected!`);
        console.log(`      + ${fieldsAppeared.length} fields appeared`);
        console.log(`      - ${fieldsDisappeared.length} fields disappeared`);
      } else {
        console.log(`    ℹ️  No field changes detected`);
      }
    } catch (error) {
      console.log(`    ⚠️  Could not toggle: ${error}`);
    }
  }

  // Step 5: Analyze relationships
  console.log('\n🧩 Step 5: Analyzing field relationships...');
  const analysis = explorer.analyze();

  console.log(`  ✓ Analysis complete`);
  console.log(`    - Relationships detected: ${analysis.relationships.length}`);
  console.log(`    - Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
  console.log(`    - Mutations observed: ${analysis.mutations.length}`);

  if (analysis.ambiguities && analysis.ambiguities.length > 0) {
    console.log(`    ⚠️  Ambiguities: ${analysis.ambiguities.length}`);
    analysis.ambiguities.forEach(a => console.log(`      - ${a}`));
  }

  // Step 6: Generate schema
  console.log('\n📝 Step 6: Generating JSON Schema...');

  const generator = new SchemaGenerator();
  const metadata: SchemaMetadata = {
    formUrl,
    resourceType,
    extractedAt: new Date().toISOString(),
    version: '1.0.0',
    advancedFields: findAdvancedFields(baselineFields),
    warnings: [],
  };

  const output = generator.generate({
    formFields: baselineFields,
    oneOfRelationships: analysis.relationships,
    metadata,
    formUrl,
  });

  console.log(`  ✓ Schema generated`);
  console.log(`    - Coverage: ${output.coverage.percentage.toFixed(1)}%`);
  console.log(`    - Fields: ${output.coverage.schemaFields}/${output.coverage.totalFields}`);

  // Step 7: Save outputs
  console.log('\n💾 Step 7: Saving outputs...');

  const schemasDir = path.join(process.cwd(), 'schemas');
  const metadataDir = path.join(process.cwd(), 'metadata');

  await fs.mkdir(schemasDir, { recursive: true });
  await fs.mkdir(metadataDir, { recursive: true });

  // Write schema
  const schemaPath = path.join(schemasDir, `${resourceType}.schema.json`);
  await fs.writeFile(
    schemaPath,
    JSON.stringify(output.schema, null, 2),
    'utf-8'
  );
  console.log(`  📄 ${schemaPath}`);

  // Write selectors
  const selectorPath = path.join(metadataDir, `${resourceType}-selectors.json`);
  await fs.writeFile(
    selectorPath,
    JSON.stringify(output.selectorMetadata, null, 2),
    'utf-8'
  );
  console.log(`  🎯 ${selectorPath}`);

  // Write captured states for debugging
  const statesPath = path.join(metadataDir, `${resourceType}-states.json`);
  const states: any = {};
  for (const [stateId, fields] of explorer.getStates().entries()) {
    states[stateId] = fields.map(f => ({
      name: f.name,
      type: f.type,
      required: f.required,
      options: f.options,
    }));
  }
  await fs.writeFile(
    statesPath,
    JSON.stringify(states, null, 2),
    'utf-8'
  );
  console.log(`  🗂️  ${statesPath}`);

  console.log('\n✨ Extraction complete!\n');

  // Print summary
  console.log('📊 Summary:');
  console.log(`  Resource: ${resourceType}`);
  console.log(`  States captured: ${explorer.getStates().size}`);
  console.log(`  OneOf relationships: ${analysis.relationships.length}`);
  console.log(`  Detection confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
  console.log(`  Schema coverage: ${output.coverage.percentage.toFixed(1)}%`);
  console.log(`  Total fields: ${baselineFields.length}`);
}

/**
 * Identify which fields are marked as "advanced"
 */
function findAdvancedFields(fields: DetectedFormField[]): string[] {
  // Heuristic: fields that appear after "Show Advanced Fields" toggle
  // or have "advanced" in their labels/descriptions
  return fields
    .filter(f =>
      f.name.toLowerCase().includes('advanced') ||
      f.name.toLowerCase().includes('jitter') ||
      f.name.toLowerCase().includes('percent')
    )
    .map(f => f.name);
}

// Main execution
async function main() {
  console.log('🚀 F5 XC Console Schema Extractor\n');
  console.log('This script will programmatically:');
  console.log('  1. Capture form baseline state');
  console.log('  2. Systematically explore all dropdowns');
  console.log('  3. Test all toggle states');
  console.log('  4. Detect oneOf relationships');
  console.log('  5. Generate complete JSON Schema');
  console.log('  6. Save schemas and metadata\n');

  // TODO: Integrate with actual Chrome MCP tools
  // For now, this is a framework that would be called from a browser context
  console.log('⚠️  This script requires Chrome browser integration');
  console.log('    Run from within a browser automation context\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { extractFormSchema, FormExplorer, BrowserTools };
