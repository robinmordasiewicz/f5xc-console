// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { FormHandler, DetectedFormField } from '../handlers/form-handler';
import { ParsedSnapshot, getSnapshotParser } from '../mcp/snapshot-parser';
import { OneOfDetector } from './oneof-detector';
import { SchemaGenerator } from './schema-generator';
import { BaseExtractor } from './base-extractor';
import {
  SchemaExtractionConfig,
  SchemaGenerationInput,
  SchemaGenerationOutput,
  SchemaMetadata,
  JSONSchema,
  SelectorMetadata,
  SchemaExtractionError,
  SchemaExtractionErrorDetails,
  ResourceConfig,
} from '../types/schema-extractor';

interface ExtractionParams {
  baselineSnapshot: ParsedSnapshot;
  resourceType: string;
  formUrl: string;
  stateSnapshots?: Array<{
    dropdownName: string;
    optionValue: string;
    snapshot: ParsedSnapshot;
  }>;
}

export class SchemaExtractor extends BaseExtractor {
  private formHandler: FormHandler;
  private detector: OneOfDetector;
  private generator: SchemaGenerator;
  private extractionParams?: ExtractionParams;

  constructor(config: Partial<SchemaExtractionConfig> = {}) {
    super(config);
    this.formHandler = new FormHandler();
    this.detector = new OneOfDetector();
    this.generator = new SchemaGenerator();
  }

  setExtractionParams(params: ExtractionParams): void {
    this.extractionParams = params;
  }

  protected async executeExtraction(
    config: ResourceConfig,
    namespace: string
  ): Promise<SchemaGenerationOutput> {
    if (!this.extractionParams) {
      throw new Error('Extraction parameters not set. Call setExtractionParams() first or use extractFromSnapshot().');
    }

    return await this.performExtraction(this.extractionParams);
  }

  async extractFromSnapshot(params: {
    baselineSnapshot: ParsedSnapshot;
    resourceType: string;
    formUrl: string;
    stateSnapshots?: Array<{
      dropdownName: string;
      optionValue: string;
      snapshot: ParsedSnapshot;
    }>;
  }): Promise<SchemaGenerationOutput> {
    this.setExtractionParams(params);
    return await this.performExtraction(params);
  }

  private async performExtraction(params: ExtractionParams): Promise<SchemaGenerationOutput> {
    try {
      this.logger.info('Detecting baseline form fields...');
      const baselineFields = this.formHandler.detectFormFields(params.baselineSnapshot);
      this.logger.info(`Found ${baselineFields.length} fields in baseline state`);

      let oneOfRelationships: any[] = [];
      if (params.stateSnapshots && params.stateSnapshots.length > 0) {
        this.logger.info('Analyzing oneOf relationships...');
        oneOfRelationships = await this.detectOneOfRelationships(
          baselineFields,
          params.stateSnapshots
        );
        this.logger.info(`Detected ${oneOfRelationships.length} oneOf relationships`);
      } else {
        this.logger.warn('No state snapshots provided - skipping oneOf detection');
      }

      const metadata: SchemaMetadata = {
        formUrl: params.formUrl,
        resourceType: params.resourceType,
        extractedAt: new Date().toISOString(),
        version: '1.0.0',
        extractionVersion: '1.0.0',
        advancedFields: this.identifyAdvancedFields(baselineFields),
        warnings: [],
      };

      this.logger.info('Generating JSON Schema...');
      const generationInput: SchemaGenerationInput = {
        formFields: baselineFields,
        oneOfRelationships,
        metadata,
        formUrl: params.formUrl,
      };

      const output = await this.generator.generate(generationInput);

      if (this.config.validateSchema) {
        this.logger.info('Validating schema...');
        const validation = this.generator.validateSchema(output.schema);
        if (!validation.valid) {
          output.warnings.push(`Schema validation errors: ${validation.errors.join(', ')}`);
        }
      }

      await this.exportResults(params.resourceType, output);

      this.logger.info('Schema extraction complete!');
      this.logger.info(`Coverage: ${output.coverage.percentage.toFixed(1)}%`);
      this.logger.info(`Fields: ${output.coverage.schemaFields}/${output.coverage.totalFields}`);

      return output;
    } catch (error) {
      throw this.handleError('UNKNOWN_ERROR', error);
    }
  }

  private async detectOneOfRelationships(
    baselineFields: DetectedFormField[],
    stateSnapshots: Array<{
      dropdownName: string;
      optionValue: string;
      snapshot: ParsedSnapshot;
    }>
  ) {
    this.detector.reset();

    for (const state of stateSnapshots) {
      const fields = this.formHandler.detectFormFields(state.snapshot);
      this.detector.recordFieldState(state.dropdownName, state.optionValue, fields);
    }

    const result = this.detector.analyzeRelationships();

    this.logger.debug(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    this.logger.debug(`Mutations detected: ${result.mutations.length}`);

    if (result.ambiguities && result.ambiguities.length > 0) {
      this.logger.debug('Ambiguities:');
      for (const ambiguity of result.ambiguities) {
        this.logger.debug(`  - ${ambiguity}`);
      }
    }

    return result.relationships;
  }

  private identifyAdvancedFields(fields: DetectedFormField[]): string[] {
    return fields
      .filter(
        f =>
          f.name.toLowerCase().includes('advanced') ||
          f.name.toLowerCase().includes('jitter') ||
          f.name.toLowerCase().includes('timeout')
      )
      .map(f => f.name);
  }

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

  private getSuggestionsForError(type: SchemaExtractionError): string[] {
    const suggestions: Record<SchemaExtractionError, string[]> = {
      FORM_NOT_FOUND: [
        'Verify form is loaded in browser',
        'Check if you need to navigate to a specific page',
        'Ensure form is not inside a dialog or modal',
      ],
      DOM_TIMEOUT: [
        'Increase domStabilizationTimeout in config',
        'Verify page has finished loading',
        'Check for JavaScript errors in console',
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
        'Try manually opening nested config',
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
}

export function createSchemaExtractor(
  config?: Partial<SchemaExtractionConfig>
): SchemaExtractor {
  return new SchemaExtractor(config);
}

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
      '      - Select option',
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
