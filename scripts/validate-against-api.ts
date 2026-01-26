#!/usr/bin/env ts-node
/**
 * API Validation Automation Script
 *
 * Validates resource definitions against the official F5 XC API spec,
 * replicating manual validation and detecting discrepancies in:
 * - Field constraints (minimum, maximum, minLength, maxLength)
 * - Enum values
 * - Required fields
 * - Data types
 *
 * Usage:
 *   npx ts-node scripts/validate-against-api.ts
 *   npx ts-node scripts/validate-against-api.ts --resource healthcheck
 *   npx ts-node scripts/validate-against-api.ts --version v2.0.46
 *   npx ts-node scripts/validate-against-api.ts --suggest-fixes
 *
 * Source of truth definitions: src/definitions/*.definition.ts
 * API Spec Source: https://github.com/robinmordasiewicz/f5xc-api-enriched/releases
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  downloadApiSpec,
  loadOpenAPISpec,
  loadApiSchema,
  findPropertyByPath,
  extractValidationRules,
  OpenAPISchema,
  APISchemaDefinition,
  RESOURCE_SCHEMA_MAPPING,
} from '../src/validation/api-schema-loader';
import {
  compareField,
  Discrepancy,
  DiscrepancySeverity,
  generateFixSnippet,
  filterBySeverity,
} from '../src/validation/field-comparator';
import { ResourceDefinition, FieldDefinition, NestedConfigDefinition, ArrayFieldDefinition } from '../src/extractors/resource-definition';

// Import resource definitions from centralized index
import { ALL_DEFINITIONS, DEFINITIONS_BY_TYPE } from '../src/definitions';

/**
 * Validation result for a resource
 */
interface ValidationResult {
  resourceType: string;
  apiSchemaName: string;
  totalFields: number;
  validFields: number;
  discrepancies: Discrepancy[];
  apiVersion: string;
}

/**
 * Command line arguments
 */
interface CLIArgs {
  resource?: string;
  version?: string;
  suggestFixes: boolean;
  outputReport: boolean;
  severity: DiscrepancySeverity;
}

/**
 * All available resource definitions (from centralized index)
 */
const RESOURCE_DEFINITIONS: Record<string, ResourceDefinition> = DEFINITIONS_BY_TYPE;

/**
 * Parse command line arguments
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    suggestFixes: false,
    outputReport: true,
    severity: 'warning',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--resource':
      case '-r':
        result.resource = args[++i];
        break;
      case '--version':
      case '-v':
        result.version = args[++i];
        break;
      case '--suggest-fixes':
      case '-f':
        result.suggestFixes = true;
        break;
      case '--no-report':
        result.outputReport = false;
        break;
      case '--severity':
      case '-s':
        result.severity = args[++i] as DiscrepancySeverity;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return result;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
API Validation Script - Validate resource definitions against F5 XC API spec

Usage:
  npx ts-node scripts/validate-against-api.ts [options]

Options:
  --resource, -r <type>   Validate specific resource (healthcheck, origin_pool, app_firewall, service_policy)
  --version, -v <version> Use specific API spec version (e.g., v2.0.46)
  --suggest-fixes, -f     Generate fix suggestions with code snippets
  --severity, -s <level>  Minimum severity to report (error, warning, info)
  --no-report             Skip generating markdown report
  --help, -h              Show this help message

Examples:
  npx ts-node scripts/validate-against-api.ts
  npx ts-node scripts/validate-against-api.ts --resource healthcheck
  npx ts-node scripts/validate-against-api.ts --version v2.0.46 --suggest-fixes
`);
}

/**
 * Collect all fields from a resource definition
 */
function collectAllFields(definition: ResourceDefinition): FieldDefinition[] {
  const fields: FieldDefinition[] = [...definition.fields];

  // Collect nested config fields
  if (definition.nestedConfigs) {
    for (const config of definition.nestedConfigs) {
      fields.push(...config.fields);
    }
  }

  // Collect array field item fields
  if (definition.arrayFields) {
    for (const arrayField of definition.arrayFields) {
      if (arrayField.itemTypes) {
        for (const itemType of Object.values(arrayField.itemTypes)) {
          fields.push(...itemType.fields);
        }
      }
    }
  }

  return fields;
}

/**
 * Validate a single resource against API schema
 */
function validateResource(
  definition: ResourceDefinition,
  openapi: OpenAPISchema,
  apiVersion: string
): ValidationResult {
  const schemas = loadApiSchema(definition.resourceType, openapi);
  const allFields = collectAllFields(definition);
  const discrepancies: Discrepancy[] = [];
  let validFields = 0;

  for (const field of allFields) {
    // Skip fields without apiProperty mapping
    if (!field.apiProperty) {
      validFields++;
      continue;
    }

    // Find the corresponding API property
    const apiProp = findPropertyByPath(schemas, field.apiProperty, openapi);

    // Compare field against API property
    const result = compareField(field, apiProp);

    if (result.valid) {
      validFields++;
    } else {
      discrepancies.push(...result.discrepancies);
    }
  }

  return {
    resourceType: definition.resourceType,
    apiSchemaName: RESOURCE_SCHEMA_MAPPING[definition.resourceType]?.[0] || 'unknown',
    totalFields: allFields.length,
    validFields,
    discrepancies,
    apiVersion,
  };
}

/**
 * Print validation result to console with colors
 */
function printResult(result: ValidationResult, suggestFixes: boolean): void {
  const { resourceType, totalFields, validFields, discrepancies } = result;

  console.log(`\n${resourceType}...`);

  if (discrepancies.length === 0) {
    console.log(`  \x1b[32m✅ ${validFields} fields validated\x1b[0m`);
  } else {
    console.log(`  \x1b[32m✅ ${validFields} fields validated\x1b[0m`);
    console.log(`  \x1b[33m⚠️ ${discrepancies.length} discrepancies found:\x1b[0m`);

    for (const d of discrepancies) {
      const color = d.severity === 'error' ? '\x1b[31m' : '\x1b[33m';
      console.log(
        `${color}     - ${d.field}.${d.property}: definition=${JSON.stringify(d.definitionValue)}, API=${JSON.stringify(d.apiValue)}\x1b[0m`
      );

      if (suggestFixes) {
        console.log(`       Fix: ${generateFixSnippet(d)}`);
      }
    }
  }
}

/**
 * Generate markdown report
 */
function generateReport(results: ValidationResult[], apiVersion: string): string {
  const timestamp = new Date().toISOString();
  let totalFields = 0;
  let totalValid = 0;
  let totalDiscrepancies = 0;

  for (const result of results) {
    totalFields += result.totalFields;
    totalValid += result.validFields;
    totalDiscrepancies += result.discrepancies.length;
  }

  const validPercentage = ((totalValid / totalFields) * 100).toFixed(1);

  let report = `# API Validation Report

**Generated:** ${timestamp}
**API Spec Version:** ${apiVersion}
**Validation Framework:** f5xc-console

## Summary

| Metric | Value |
|--------|-------|
| Resources validated | ${results.length} |
| Total fields | ${totalFields} |
| Valid fields | ${totalValid} (${validPercentage}%) |
| Discrepancies | ${totalDiscrepancies} |

`;

  // Per-resource details
  for (const result of results) {
    report += `## ${result.resourceType}

**API Schema:** \`${result.apiSchemaName}\`
**Fields:** ${result.totalFields} total, ${result.validFields} valid
**Discrepancies:** ${result.discrepancies.length}

`;

    if (result.discrepancies.length > 0) {
      report += `### Discrepancies

| Field | Property | Definition Value | API Value | Severity | Suggestion |
|-------|----------|------------------|-----------|----------|------------|
`;

      for (const d of result.discrepancies) {
        report += `| ${d.field} | ${d.property} | \`${JSON.stringify(d.definitionValue)}\` | \`${JSON.stringify(d.apiValue)}\` | ${d.severity} | ${d.suggestion} |\n`;
      }

      report += `
### Recommended Fixes

\`\`\`typescript
// ${result.resourceType}.definition.ts fixes:
`;

      for (const d of result.discrepancies) {
        report += `// ${d.field}:\n${generateFixSnippet(d)}\n\n`;
      }

      report += `\`\`\`

`;
    } else {
      report += `*No discrepancies found.*\n\n`;
    }
  }

  return report;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = parseArgs();

  console.log('\x1b[36m🔍 Validating resource definitions against F5 XC API spec\x1b[0m\n');

  // Download API spec
  let specPath: string;
  let apiVersion: string;

  try {
    specPath = await downloadApiSpec(args.version);
    apiVersion = args.version || specPath.split('/').slice(-2)[0];
  } catch (error) {
    console.error('\x1b[31m❌ Failed to download API spec:\x1b[0m', error);
    process.exit(1);
  }

  // Load OpenAPI spec
  console.log('\n📂 Loading OpenAPI specification...');
  const openapi = loadOpenAPISpec(specPath);
  console.log(`   Schemas found: ${Object.keys(openapi.components.schemas).length}`);

  // Determine which resources to validate
  const resourcesToValidate = args.resource
    ? [args.resource]
    : Object.keys(RESOURCE_DEFINITIONS);

  // Validate resources
  const results: ValidationResult[] = [];

  for (const resourceType of resourcesToValidate) {
    const definition = RESOURCE_DEFINITIONS[resourceType];
    if (!definition) {
      console.error(`\x1b[31m❌ Unknown resource type: ${resourceType}\x1b[0m`);
      continue;
    }

    const result = validateResource(definition, openapi, apiVersion);

    // Filter by severity
    result.discrepancies = filterBySeverity(result.discrepancies, args.severity);

    results.push(result);
    printResult(result, args.suggestFixes);
  }

  // Print summary
  console.log('\n\x1b[36m📊 Summary:\x1b[0m');

  let totalFields = 0;
  let totalValid = 0;
  let totalDiscrepancies = 0;

  for (const result of results) {
    totalFields += result.totalFields;
    totalValid += result.validFields;
    totalDiscrepancies += result.discrepancies.length;
  }

  const validPercentage = ((totalValid / totalFields) * 100).toFixed(1);

  console.log(`   Resources validated: ${results.length}`);
  console.log(`   Total fields: ${totalFields}`);
  console.log(`   Valid fields: ${totalValid} (${validPercentage}%)`);
  console.log(`   Discrepancies: ${totalDiscrepancies}`);

  // Generate report
  if (args.outputReport) {
    const reportsDir = path.resolve(__dirname, '../reports');
    fs.mkdirSync(reportsDir, { recursive: true });

    const reportPath = path.join(reportsDir, 'api-validation-report.md');
    const report = generateReport(results, apiVersion);
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`\n📝 Report generated: ${reportPath}`);
  }

  // Exit with error code if discrepancies found
  if (totalDiscrepancies > 0) {
    const errorCount = results.reduce(
      (sum, r) => sum + r.discrepancies.filter((d) => d.severity === 'error').length,
      0
    );

    if (errorCount > 0) {
      console.log(`\n\x1b[31m❌ ${errorCount} error-level discrepancies found\x1b[0m`);
      process.exit(1);
    } else {
      console.log(`\n\x1b[33m⚠️ ${totalDiscrepancies} warning-level discrepancies found\x1b[0m`);
    }
  } else {
    console.log(`\n\x1b[32m✅ All fields validated successfully!\x1b[0m`);
  }
}

main().catch((error) => {
  console.error('\x1b[31m❌ Error:\x1b[0m', error);
  process.exit(1);
});
