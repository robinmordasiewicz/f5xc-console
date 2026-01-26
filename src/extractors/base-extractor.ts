// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { LoggerService } from '../logging/logger-service';
import { ValidationService } from '../validation/validation-service';
import { ExportService } from '../export/export-service';
import {
  SchemaExtractionConfig,
  SchemaGenerationOutput,
} from '../types/schema-extractor';

interface ResourceConfig {
  resourceType?: string;
  description?: string;
  api_type?: string;
  field_mappings?: Record<string, string>;
  discriminators?: Array<any>;
  arrays?: Array<any>;
  validation_rules?: any;
}

export abstract class BaseExtractor {
  protected config: SchemaExtractionConfig;
  protected logger: LoggerService;
  protected validator: ValidationService;
  protected exporter: ExportService;

  constructor(config: Partial<SchemaExtractionConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.logger = LoggerService.getInstance();
    this.validator = new ValidationService();
    this.exporter = new ExportService(this.config.outputDir);
  }

  async extract(resourceType: string, namespace: string): Promise<SchemaGenerationOutput> {
    this.logger.startExtraction(resourceType, namespace);

    try {
      const config = await this.loadConfiguration(resourceType);
      this.validateConfiguration(config);

      await this.initializeComponents(config);

      const result = await this.executeExtraction(config, namespace);

      this.validateResults(result);

      await this.exportResults(resourceType, result);

      this.logger.completeExtraction(resourceType, result);
      return result;

    } catch (error) {
      this.handleExtractionError(error, resourceType);
      throw error;
    }
  }

  protected abstract executeExtraction(
    config: ResourceConfig,
    namespace: string
  ): Promise<SchemaGenerationOutput>;

  protected async initializeComponents(config: ResourceConfig): Promise<void> {
  }

  protected async loadConfiguration(resourceType: string): Promise<ResourceConfig> {
    throw new Error('Must be implemented by subclass or use ConfigurationService');
  }

  protected validateConfiguration(config: ResourceConfig): void {
    this.validator.validateResourceConfig(config);
  }

  protected validateResults(result: SchemaGenerationOutput): void {
    this.validator.validateSchemaOutput(result);
  }

  protected async exportResults(
    resourceType: string,
    result: SchemaGenerationOutput
  ): Promise<void> {
    await this.exporter.exportSchema(resourceType, result.schema);
    await this.exporter.exportSelectors(resourceType, result.selectorMetadata);
    await this.exporter.exportReport(resourceType, result);
  }

  protected handleExtractionError(error: unknown, resourceType: string): void {
    this.logger.logError(error, { resourceType, phase: 'extraction' });
  }

  private mergeWithDefaults(config: Partial<SchemaExtractionConfig>): SchemaExtractionConfig {
    return {
      expandAdvancedFields: config.expandAdvancedFields ?? true,
      extractNestedConfigs: config.extractNestedConfigs ?? true,
      maxNestingDepth: config.maxNestingDepth ?? 3,
      domStabilizationTimeout: config.domStabilizationTimeout ?? 500,
      captureScreenshots: config.captureScreenshots ?? false,
      outputDir: config.outputDir ?? './schemas',
      validateSchema: config.validateSchema ?? true,
    };
  }

  getConfig(): SchemaExtractionConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SchemaExtractionConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
