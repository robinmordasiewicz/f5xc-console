// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Schema Extractor
 *
 * Orchestrates the complete schema extraction workflow:
 * 1. Initialize browser session
 * 2. Expand to maximum state (Show Advanced Fields, nested configs)
 * 3. Detect form fields and oneOf relationships
 * 4. Generate JSON Schema
 * 5. Export schema and metadata
 *
 * This is the main entry point for schema extraction operations.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { FormHandler, DetectedFormField } from '../handlers/form-handler';
import { ParsedSnapshot, getSnapshotParser } from '../mcp/snapshot-parser';
import { OneOfDetector } from './oneof-detector';
import { SchemaGenerator } from './schema-generator';
import {
  SchemaExtractionConfig,
  SchemaGenerationInput,
  SchemaGenerationOutput,
  SchemaMetadata,
  JSONSchema,
  SelectorMetadata,
  SchemaExtractionError,
  SchemaExtractionErrorDetails,
} from '../types/schema-extractor';

/**
 * Schema Extractor class
 *
 * Usage:
 * ```typescript
 * const extractor = new SchemaExtractor({
 *   expandAdvancedFields: true,
 *   extractNestedConfigs: true,
 *   outputDir: './schemas'
 * });
 *
 * const result = await extractor.extractFromBrowser({
 *   tabId: 123,
 *   resourceType: 'healthcheck',
 *   formUrl: 'https://...'
 * });
 * ```
 */
export class SchemaExtractor {
  private config: SchemaExtractionConfig;
  private formHandler: FormHandler;
  private detector: OneOfDetector;
  private generator: SchemaGenerator;

  constructor(config: Partial<SchemaExtractionConfig> = {}) {
    this.config = {
      expandAdvancedFields: config.expandAdvancedFields ?? true,
      extractNestedConfigs: config.extractNestedConfigs ?? true,
      maxNestingDepth: config.maxNestingDepth ?? 2,
      domStabilizationTimeout: config.domStabilizationTimeout ?? 500,
      captureScreenshots: config.captureScreenshots ?? false,
      outputDir: config.outputDir ?? './schemas',
      validateSchema: config.validateSchema ?? true,
    };

    this.formHandler = new FormHandler();
    this.detector = new OneOfDetector();
    this.generator = new SchemaGenerator();
  }

  /**
   * Extract schema from browser form
   *
   * This method coordinates the extraction using external MCP browser tools.
   * The actual browser interactions must be performed by the caller.
   *
   * @param params - Extraction parameters
   * @returns Generated schema and metadata
   */
  async extractFromSnapshot(params: {
    /** Initial snapshot with form in maximum expanded state */
    baselineSnapshot: ParsedSnapshot;
    /** Resource type (e.g., 'healthcheck', 'origin_pool') */
    resourceType: string;
    /** Form URL */
    formUrl: string;
    /** Optional: Snapshots for each dropdown state (for oneOf detection) */
    stateSnapshots?: Array<{
      dropdownName: string;
      optionValue: string;
      snapshot: ParsedSnapshot;
    }>;
  }): Promise<SchemaGenerationOutput> {
    try {
      // Step 1: Detect baseline fields
      console.log('📋 Detecting baseline form fields...');
      const baselineFields = this.formHandler.detectFormFields(params.baselineSnapshot);
      console.log(`Found ${baselineFields.length} fields in baseline state`);

      // Step 2: Detect oneOf relationships (if state snapshots provided)
      let oneOfRelationships = [];
      if (params.stateSnapshots && params.stateSnapshots.length > 0) {
        console.log('🔍 Analyzing oneOf relationships...');
        oneOfRelationships = await this.detectOneOfRelationships(
          baselineFields,
          params.stateSnapshots
        );
        console.log(`Detected ${oneOfRelationships.length} oneOf relationships`);
      } else {
        console.log('⚠️  No state snapshots provided - skipping oneOf detection');
      }

      // Step 3: Prepare metadata
      const metadata: SchemaMetadata = {
        formUrl: params.formUrl,
        resourceType: params.resourceType,
        extractedAt: new Date().toISOString(),
        version: '1.0.0',
        advancedFields: this.identifyAdvancedFields(baselineFields),
        warnings: [],
      };

      // Step 4: Generate schema
      console.log('⚙️  Generating JSON Schema...');
      const generationInput: SchemaGenerationInput = {
        formFields: baselineFields,
        oneOfRelationships,
        metadata,
        formUrl: params.formUrl,
      };

      const output = this.generator.generate(generationInput);

      // Step 5: Validate schema
      if (this.config.validateSchema) {
        console.log('✅ Validating schema...');
        const validation = this.generator.validateSchema(output.schema);
        if (!validation.valid) {
          output.warnings.push(`Schema validation errors: ${validation.errors.join(', ')}`);
        }
      }

      // Step 6: Export files
      await this.exportSchema(params.resourceType, output);

      console.log('✨ Schema extraction complete!');
      console.log(`📊 Coverage: ${output.coverage.percentage.toFixed(1)}%`);
      console.log(`📄 Schema: ${output.coverage.schemaFields}/${output.coverage.totalFields} fields`);

      return output;
    } catch (error) {
      throw this.handleError('UNKNOWN_ERROR', error);
    }
  }

  /**
   * Detect oneOf relationships from state snapshots
   */
  private async detectOneOfRelationships(
    baselineFields: DetectedFormField[],
    stateSnapshots: Array<{
      dropdownName: string;
      optionValue: string;
      snapshot: ParsedSnapshot;
    }>
  ) {
    this.detector.reset();

    // Record each state
    for (const state of stateSnapshots) {
      const fields = this.formHandler.detectFormFields(state.snapshot);
      this.detector.recordFieldState(state.dropdownName, state.optionValue, fields);
    }

    // Analyze relationships
    const result = this.detector.analyzeRelationships();

    // Log analysis results
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Mutations detected: ${result.mutations.length}`);
    if (result.ambiguities && result.ambiguities.length > 0) {
      console.log('  Ambiguities:');
      for (const ambiguity of result.ambiguities) {
        console.log(`    - ${ambiguity}`);
      }
    }

    return result.relationships;
  }

  /**
   * Identify advanced fields (heuristic)
   *
   * This is a placeholder - real implementation would need to track
   * which fields were revealed by "Show Advanced Fields" toggle
   */
  private identifyAdvancedFields(fields: DetectedFormField[]): string[] {
    // Heuristic: Fields with "advanced", "jitter", "timeout" in name
    return fields
      .filter(
        f =>
          f.name.toLowerCase().includes('advanced') ||
          f.name.toLowerCase().includes('jitter') ||
          f.name.toLowerCase().includes('timeout')
      )
      .map(f => f.name);
  }

  /**
   * Export schema and metadata to files
   */
  private async exportSchema(
    resourceType: string,
    output: SchemaGenerationOutput
  ): Promise<void> {
    // Create output directories
    const schemasDir = path.join(this.config.outputDir, 'schemas');
    const metadataDir = path.join(this.config.outputDir, 'metadata');

    await fs.mkdir(schemasDir, { recursive: true });
    await fs.mkdir(metadataDir, { recursive: true });

    // Export JSON Schema
    const schemaPath = path.join(schemasDir, `${resourceType}.schema.json`);
    await fs.writeFile(schemaPath, JSON.stringify(output.schema, null, 2), 'utf-8');
    console.log(`📄 Schema exported: ${schemaPath}`);

    // Export selector metadata
    const selectorPath = path.join(metadataDir, `${resourceType}-selectors.json`);
    await fs.writeFile(
      selectorPath,
      JSON.stringify(output.selectorMetadata, null, 2),
      'utf-8'
    );
    console.log(`🎯 Selectors exported: ${selectorPath}`);

    // Export warnings (if any)
    if (output.warnings.length > 0) {
      const warningsPath = path.join(metadataDir, `${resourceType}-warnings.json`);
      await fs.writeFile(
        warningsPath,
        JSON.stringify({ warnings: output.warnings }, null, 2),
        'utf-8'
      );
      console.log(`⚠️  Warnings exported: ${warningsPath}`);
    }
  }

  /**
   * Handle extraction errors
   */
  private handleError(type: SchemaExtractionError, error: unknown): SchemaExtractionErrorDetails {
    const message = error instanceof Error ? error.message : String(error);

    const errorDetails: SchemaExtractionErrorDetails = {
      type,
      message,
      context: error instanceof Error ? error.stack : undefined,
      suggestions: this.getSuggestionsForError(type),
    };

    return errorDetails;
  }

  /**
   * Get recovery suggestions for error type
   */
  private getSuggestionsForError(type: SchemaExtractionError): string[] {
    const suggestions: Record<SchemaExtractionError, string[]> = {
      FORM_NOT_FOUND: [
        'Verify the form is loaded in the browser',
        'Check if you need to navigate to a specific page',
        'Ensure the form is not inside a dialog or modal',
      ],
      DOM_TIMEOUT: [
        'Increase domStabilizationTimeout in config',
        'Verify the page has finished loading',
        'Check for JavaScript errors in the console',
      ],
      INVALID_STATE: [
        'Ensure form is in expected state',
        'Verify all required fields are visible',
        'Check for loading spinners or overlays',
      ],
      SELECTOR_FAILED: [
        'Field may have changed between snapshots',
        'Try using a more stable selector',
        'Check if field is inside a shadow DOM',
      ],
      NESTED_CONFIG_ERROR: [
        'Nested configuration dialog may not have opened',
        'Try manually opening the nested config',
        'Check if nested config requires user interaction',
      ],
      SCHEMA_VALIDATION_FAILED: [
        'Review schema structure',
        'Check for circular references',
        'Verify oneOf blocks are valid',
      ],
      UNKNOWN_ERROR: [
        'Check console for detailed error messages',
        'Try running extraction again',
        'Report issue if problem persists',
      ],
    };

    return suggestions[type] || [];
  }

  /**
   * Get current configuration
   */
  getConfig(): SchemaExtractionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SchemaExtractionConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

/**
 * Helper function to create extractor with default config
 */
export function createSchemaExtractor(
  config?: Partial<SchemaExtractionConfig>
): SchemaExtractor {
  return new SchemaExtractor(config);
}

/**
 * Helper function for manual extraction workflow
 *
 * This provides guidance for the manual extraction process.
 * The actual browser interactions must be performed using MCP tools.
 */
export function getManualExtractionSteps(resourceType: string): {
  steps: string[];
  examples: Record<string, string>;
} {
  return {
    steps: [
      '1. Open form in browser and ensure it is fully loaded',
      '2. Expand to maximum state: Click "Show Advanced Fields" if present',
      '3. Take baseline snapshot: browser.takeSnapshot()',
      '4. Identify dropdown fields that might trigger oneOf relationships',
      '5. For each dropdown:',
      '   a. For each option:',
      '      - Select the option',
      '      - Wait for DOM stabilization (500ms)',
      '      - Take snapshot',
      '      - Record dropdown name, option value, and snapshot',
      '6. Call SchemaExtractor.extractFromSnapshot() with all snapshots',
      '7. Review generated schema and warnings',
      '8. Validate schema by attempting to use it for form filling',
    ],
    examples: {
      baseline: `
// Step 3: Capture baseline
const parser = getSnapshotParser();
const baselineSnapshot = parser.parse(await browser.takeSnapshot());
const baselineFields = formHandler.detectFormFields(baselineSnapshot);
      `,
      stateCapture: `
// Step 5: Capture dropdown states
const stateSnapshots = [];

for (const dropdown of dropdowns) {
  for (const option of dropdown.options) {
    await browser.selectOption(dropdown.uid, option);
    await browser.wait(500);

    const snapshot = parser.parse(await browser.takeSnapshot());
    stateSnapshots.push({
      dropdownName: dropdown.name,
      optionValue: option,
      snapshot
    });
  }
}
      `,
      extraction: `
// Step 6: Extract schema
const extractor = createSchemaExtractor({
  outputDir: './schemas',
  expandAdvancedFields: true
});

const result = await extractor.extractFromSnapshot({
  baselineSnapshot,
  resourceType: '${resourceType}',
  formUrl: currentUrl,
  stateSnapshots
});
      `,
    },
  };
}
