// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { writeFile, mkdir } from 'fs/promises';
import * as path from 'path';
import { LoggerService } from '../logging/logger-service';
import {
  JSONSchema,
  SchemaGenerationOutput,
  SelectorMetadata,
} from '../types/schema-extractor';

export class ExportService {
  private outputDir: string;
  private logger: LoggerService;

  constructor(outputDir: string = './schemas') {
    this.outputDir = outputDir;
    this.logger = LoggerService.getInstance();
  }

  async exportSchema(resourceType: string, schema: JSONSchema): Promise<string> {
    const schemaPath = this.getSchemaPath(resourceType);
    await this.ensureDirectory(path.dirname(schemaPath));
    await writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');

    this.logger.info('Schema exported', { resourceType, path: schemaPath });
    return schemaPath;
  }

  async exportSelectors(
    resourceType: string,
    selectors: SelectorMetadata
  ): Promise<string> {
    const selectorsPath = this.getSelectorsPath(resourceType);
    await this.ensureDirectory(path.dirname(selectorsPath));
    await writeFile(
      selectorsPath,
      JSON.stringify(selectors, null, 2),
      'utf-8'
    );

    this.logger.info('Selectors exported', { resourceType, path: selectorsPath });
    return selectorsPath;
  }

  async exportReport(resourceType: string, output: SchemaGenerationOutput): Promise<string> {
    const report = this.buildReport(resourceType, output);
    const reportPath = this.getReportPath(resourceType);
    await this.ensureDirectory(path.dirname(reportPath));
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    this.logger.info('Report exported', { resourceType, path: reportPath });
    return reportPath;
  }

  private buildReport(resourceType: string, output: SchemaGenerationOutput): any {
    const metadata = output.schema?.['x-f5xc-metadata'];

    return {
      extractedAt: metadata?.extractedAt,
      extractionVersion: metadata?.extractionVersion,
      resourceType,
      coverage: output.coverage,
      warnings: output.warnings,
      apiDiscovery: metadata?.apiDiscovery,
      statistics: {
        totalFields: output.coverage.totalFields,
        schemaFields: output.coverage.schemaFields,
        percentage: output.coverage.percentage,
      },
    };
  }

  private getSchemaPath(resourceType: string): string {
    return path.join(this.outputDir, `${resourceType}.schema.json`);
  }

  private getSelectorsPath(resourceType: string): string {
    return path.join(this.outputDir, `${resourceType}-selectors.json`);
  }

  private getReportPath(resourceType: string): string {
    return path.join(this.outputDir, `${resourceType}-report.json`);
  }

  private async ensureDirectory(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }
}
