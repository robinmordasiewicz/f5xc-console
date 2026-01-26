#!/usr/bin/env ts-node
/**
 * API Constraint Synchronization Script
 *
 * Automatically synchronizes validation constraints from F5 XC API spec
 * to resource definitions. This ensures our schemas match actual API limits.
 *
 * Problem Solved:
 *   Manually maintained constraints (minLength, maxLength, minimum, maximum)
 *   can drift from actual API values, causing schema validation to accept
 *   values the API will reject, or reject values the API would accept.
 *
 * Solution:
 *   1. Download API spec from f5xc-api-enriched (includes upstream validation)
 *   2. Extract constraints for each field (already validated upstream)
 *   3. Generate/update constraints overlay file
 *   4. Apply constraints to definitions programmatically
 *
 * Note: The f5xc-api-enriched repository provides OpenAPI specs with
 * upstream live API validation, eliminating the need for local validation.
 *
 * Usage:
 *   npx ts-node scripts/sync-api-constraints.ts              # Analyze discrepancies
 *   npx ts-node scripts/sync-api-constraints.ts --apply      # Apply fixes to definitions
 *   npx ts-node scripts/sync-api-constraints.ts --generate   # Generate constraints file only
 *
 * This script is idempotent - running multiple times produces the same result.
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
  RESOURCE_SCHEMA_MAPPING,
} from '../src/validation/api-schema-loader';
import { ALL_DEFINITIONS, DEFINITIONS_BY_TYPE } from '../src/definitions';
import type { ResourceDefinition, FieldDefinition, NestedConfigDefinition, ArrayFieldDefinition } from '../src/extractors/resource-definition';

/**
 * Constraint values extracted from API
 */
interface ApiConstraints {
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  enum?: string[];
}

/**
 * Field constraint entry with source tracking
 */
interface FieldConstraintEntry {
  apiProperty: string;
  definitionConstraints: ApiConstraints;
  apiConstraints: ApiConstraints;
  discrepancies: string[];
}

/**
 * Resource constraint map
 */
interface ResourceConstraints {
  resourceType: string;
  apiVersion: string;
  fields: Record<string, FieldConstraintEntry>;
}

/**
 * Complete constraints file structure
 */
interface ConstraintsFile {
  generatedAt: string;
  apiVersion: string;
  resources: Record<string, ResourceConstraints>;
}

/**
 * Collect all fields with apiProperty from a definition
 */
function collectFieldsWithApiProperty(definition: ResourceDefinition): { field: FieldDefinition; path: string }[] {
  const result: { field: FieldDefinition; path: string }[] = [];

  // Top-level fields
  for (const field of definition.fields) {
    if (field.apiProperty) {
      result.push({ field, path: `fields.${field.name}` });
    }
  }

  // Nested config fields
  if (definition.nestedConfigs) {
    for (const config of definition.nestedConfigs) {
      for (const field of config.fields) {
        if (field.apiProperty) {
          result.push({ field, path: `nestedConfigs.${config.name}.fields.${field.name}` });
        }
      }
    }
  }

  // Array field item fields
  if (definition.arrayFields) {
    for (const arrayField of definition.arrayFields) {
      if (arrayField.itemTypes) {
        for (const [itemType, itemDef] of Object.entries(arrayField.itemTypes)) {
          for (const field of itemDef.fields) {
            if (field.apiProperty) {
              result.push({ field, path: `arrayFields.${arrayField.name}.itemTypes.${itemType}.fields.${field.name}` });
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * Extract constraints from a FieldDefinition
 */
function extractDefinitionConstraints(field: FieldDefinition): ApiConstraints {
  const constraints: ApiConstraints = {};

  if (field.minLength !== undefined) constraints.minLength = field.minLength;
  if (field.maxLength !== undefined) constraints.maxLength = field.maxLength;
  if (field.minimum !== undefined) constraints.minimum = field.minimum;
  if (field.maximum !== undefined) constraints.maximum = field.maximum;
  if (field.minItems !== undefined) constraints.minItems = field.minItems;
  if (field.maxItems !== undefined) constraints.maxItems = field.maxItems;
  if (field.pattern !== undefined) constraints.pattern = field.pattern;
  if (field.enum !== undefined) constraints.enum = field.enum;

  return constraints;
}

/**
 * Find discrepancies between definition and API constraints
 */
function findDiscrepancies(defConstraints: ApiConstraints, apiConstraints: ApiConstraints): string[] {
  const discrepancies: string[] = [];

  // Compare string constraints
  if (defConstraints.minLength !== undefined && apiConstraints.minLength !== undefined) {
    if (defConstraints.minLength !== apiConstraints.minLength) {
      discrepancies.push(`minLength: ${defConstraints.minLength} → ${apiConstraints.minLength}`);
    }
  }
  if (defConstraints.maxLength !== undefined && apiConstraints.maxLength !== undefined) {
    if (defConstraints.maxLength !== apiConstraints.maxLength) {
      discrepancies.push(`maxLength: ${defConstraints.maxLength} → ${apiConstraints.maxLength}`);
    }
  }

  // Compare number constraints
  if (defConstraints.minimum !== undefined && apiConstraints.minimum !== undefined) {
    if (defConstraints.minimum !== apiConstraints.minimum) {
      discrepancies.push(`minimum: ${defConstraints.minimum} → ${apiConstraints.minimum}`);
    }
  }
  if (defConstraints.maximum !== undefined && apiConstraints.maximum !== undefined) {
    if (defConstraints.maximum !== apiConstraints.maximum) {
      discrepancies.push(`maximum: ${defConstraints.maximum} → ${apiConstraints.maximum}`);
    }
  }

  // Compare array constraints
  if (defConstraints.minItems !== undefined && apiConstraints.minItems !== undefined) {
    if (defConstraints.minItems !== apiConstraints.minItems) {
      discrepancies.push(`minItems: ${defConstraints.minItems} → ${apiConstraints.minItems}`);
    }
  }
  if (defConstraints.maxItems !== undefined && apiConstraints.maxItems !== undefined) {
    if (defConstraints.maxItems !== apiConstraints.maxItems) {
      discrepancies.push(`maxItems: ${defConstraints.maxItems} → ${apiConstraints.maxItems}`);
    }
  }

  return discrepancies;
}

/**
 * Analyze constraints for a single resource
 */
function analyzeResource(
  definition: ResourceDefinition,
  openapi: OpenAPISchema,
  apiVersion: string
): ResourceConstraints {
  const schemas = loadApiSchema(definition.resourceType, openapi);
  const fieldsWithApi = collectFieldsWithApiProperty(definition);
  const fields: Record<string, FieldConstraintEntry> = {};

  for (const { field, path } of fieldsWithApi) {
    const apiProp = findPropertyByPath(schemas, field.apiProperty!, openapi);
    const defConstraints = extractDefinitionConstraints(field);
    const apiConstraints = apiProp ? extractValidationRules(apiProp) : {};

    // Only include fields with constraints to compare
    if (Object.keys(defConstraints).length > 0 || Object.keys(apiConstraints).length > 0) {
      const discrepancies = findDiscrepancies(defConstraints, apiConstraints);

      fields[path] = {
        apiProperty: field.apiProperty!,
        definitionConstraints: defConstraints,
        apiConstraints,
        discrepancies,
      };
    }
  }

  return {
    resourceType: definition.resourceType,
    apiVersion,
    fields,
  };
}

/**
 * Generate fix code for a field in a definition file
 */
function generateFieldFix(fieldName: string, apiConstraints: ApiConstraints): string {
  const fixes: string[] = [];

  if (apiConstraints.minLength !== undefined) {
    fixes.push(`minLength: ${apiConstraints.minLength},`);
  }
  if (apiConstraints.maxLength !== undefined) {
    fixes.push(`maxLength: ${apiConstraints.maxLength},`);
  }
  if (apiConstraints.minimum !== undefined) {
    fixes.push(`minimum: ${apiConstraints.minimum},`);
  }
  if (apiConstraints.maximum !== undefined) {
    fixes.push(`maximum: ${apiConstraints.maximum},`);
  }
  if (apiConstraints.minItems !== undefined) {
    fixes.push(`minItems: ${apiConstraints.minItems},`);
  }
  if (apiConstraints.maxItems !== undefined) {
    fixes.push(`maxItems: ${apiConstraints.maxItems},`);
  }

  return fixes.join(' ');
}

/**
 * Apply fixes to a definition file
 * This is a simple regex-based approach that updates constraint values in place
 */
function applyFixesToFile(filePath: string, fixes: { fieldName: string; property: string; oldValue: any; newValue: any }[]): boolean {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const fix of fixes) {
    // Match patterns like "minLength: 1," or "maxLength: 63,"
    const pattern = new RegExp(`(${fix.property}:\\s*)${fix.oldValue}(\\s*,)`, 'g');
    const newContent = content.replace(pattern, `$1${fix.newValue}$2`);

    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`    ✓ ${fix.fieldName}.${fix.property}: ${fix.oldValue} → ${fix.newValue}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return modified;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { apply: boolean; generate: boolean; version?: string } {
  const args = process.argv.slice(2);
  return {
    apply: args.includes('--apply'),
    generate: args.includes('--generate'),
    version: args.find((a, i) => args[i - 1] === '--version'),
  };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = parseArgs();

  console.log('\n\x1b[36m🔄 API Constraint Synchronization\x1b[0m\n');

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
  console.log('📂 Loading OpenAPI specification...');
  const openapi = loadOpenAPISpec(specPath);
  console.log(`   Schemas found: ${Object.keys(openapi.components.schemas).length}`);

  // Analyze all resources
  const constraintsFile: ConstraintsFile = {
    generatedAt: new Date().toISOString(),
    apiVersion,
    resources: {},
  };

  let totalDiscrepancies = 0;
  const allFixes: { resourceType: string; fieldPath: string; property: string; oldValue: any; newValue: any }[] = [];

  console.log('\n📊 Analyzing constraints...\n');

  for (const definition of ALL_DEFINITIONS) {
    if (!RESOURCE_SCHEMA_MAPPING[definition.resourceType]) {
      console.log(`   ⚠️  ${definition.resourceType}: No schema mapping, skipping`);
      continue;
    }

    const resourceConstraints = analyzeResource(definition, openapi, apiVersion);
    constraintsFile.resources[definition.resourceType] = resourceConstraints;

    // Count discrepancies
    let resourceDiscrepancies = 0;
    for (const [fieldPath, entry] of Object.entries(resourceConstraints.fields)) {
      if (entry.discrepancies.length > 0) {
        resourceDiscrepancies += entry.discrepancies.length;

        // Collect fixes
        for (const discrepancy of entry.discrepancies) {
          const match = discrepancy.match(/^(\w+):\s*(\S+)\s*→\s*(\S+)$/);
          if (match) {
            allFixes.push({
              resourceType: definition.resourceType,
              fieldPath,
              property: match[1],
              oldValue: match[2],
              newValue: match[3],
            });
          }
        }
      }
    }

    if (resourceDiscrepancies > 0) {
      console.log(`   ${definition.resourceType}: \x1b[33m${resourceDiscrepancies} discrepancies\x1b[0m`);
      for (const [fieldPath, entry] of Object.entries(resourceConstraints.fields)) {
        if (entry.discrepancies.length > 0) {
          for (const d of entry.discrepancies) {
            console.log(`      - ${fieldPath.split('.').pop()}: ${d}`);
          }
        }
      }
    } else {
      console.log(`   ${definition.resourceType}: \x1b[32m✓ All constraints match\x1b[0m`);
    }

    totalDiscrepancies += resourceDiscrepancies;
  }

  console.log(`\n📈 Summary: ${totalDiscrepancies} total discrepancies across ${Object.keys(constraintsFile.resources).length} resources`);

  // Generate constraints file
  if (args.generate || args.apply) {
    const constraintsPath = path.resolve(__dirname, '../config/api-constraints.json');
    fs.mkdirSync(path.dirname(constraintsPath), { recursive: true });
    fs.writeFileSync(constraintsPath, JSON.stringify(constraintsFile, null, 2), 'utf-8');
    console.log(`\n📝 Generated: ${constraintsPath}`);
  }

  // Apply fixes
  if (args.apply && allFixes.length > 0) {
    console.log('\n🔧 Applying fixes...\n');

    // Group fixes by resource type
    const fixesByResource = new Map<string, typeof allFixes>();
    for (const fix of allFixes) {
      const existing = fixesByResource.get(fix.resourceType) || [];
      existing.push(fix);
      fixesByResource.set(fix.resourceType, existing);
    }

    // Apply fixes to each definition file
    for (const [resourceType, fixes] of fixesByResource) {
      const definitionPath = path.resolve(__dirname, `../src/definitions/${resourceType}.definition.ts`);
      console.log(`   ${resourceType}.definition.ts:`);

      const fileFixesFormatted = fixes.map(f => ({
        fieldName: f.fieldPath.split('.').pop()!,
        property: f.property,
        oldValue: f.oldValue,
        newValue: f.newValue,
      }));

      const modified = applyFixesToFile(definitionPath, fileFixesFormatted);

      if (!modified) {
        console.log('      (no changes needed or file not found)');
      }
    }

    // Also update shared api-security-common.ts if needed
    const sharedPath = path.resolve(__dirname, '../src/definitions/shared/api-security-common.ts');
    const sharedFixes = allFixes.filter(f => f.fieldPath.includes('name') && f.property === 'maxLength');
    if (sharedFixes.length > 0) {
      console.log(`\n   shared/api-security-common.ts:`);
      console.log('      ⚠️  Note: Shared file may need manual review if different resources have different maxLength values');
    }

    console.log('\n✅ Fixes applied. Run sync again to verify:');
    console.log('   npx ts-node scripts/sync-api-constraints.ts');
  } else if (totalDiscrepancies > 0 && !args.apply) {
    console.log('\n💡 To apply fixes automatically, run:');
    console.log('   npx ts-node scripts/sync-api-constraints.ts --apply');
  }

  // Exit with error code if discrepancies found (useful for CI)
  if (totalDiscrepancies > 0 && !args.apply) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\x1b[31m❌ Error:\x1b[0m', error);
  process.exit(1);
});
