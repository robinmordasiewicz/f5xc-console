// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * API Schema Loader
 *
 * Utilities for downloading and parsing F5 XC API specifications
 * from the f5xc-api-enriched GitHub repository.
 *
 * The f5xc-api-enriched repository provides OpenAPI specs with
 * constraints validated against the live API upstream, eliminating
 * the need for local live API validation.
 */

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * OpenAPI schema structure for F5 XC API
 */
export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, any>;
  components: {
    schemas: Record<string, APISchemaDefinition>;
  };
}

/**
 * API schema definition from OpenAPI spec
 */
export interface APISchemaDefinition {
  type?: string;
  properties?: Record<string, APIPropertyDefinition>;
  required?: string[];
  allOf?: APISchemaDefinition[];
  oneOf?: APISchemaDefinition[];
  anyOf?: APISchemaDefinition[];
  $ref?: string;
  description?: string;
  enum?: string[];
  'x-ves-validation-rules'?: VesValidationRules;
  'x-f5xc-constraints'?: F5XCConstraints;
}

/**
 * API property definition from OpenAPI spec
 */
export interface APIPropertyDefinition {
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  $ref?: string;
  items?: APIPropertyDefinition;
  properties?: Record<string, APIPropertyDefinition>;
  'x-ves-validation-rules'?: VesValidationRules;
  'x-f5xc-constraints'?: F5XCConstraints;
  'x-ves-oneof-field-id'?: number;
  'x-ves-oneof-field-name'?: string;
}

/**
 * F5 XC vendor validation rules extension
 * Note: The actual format in the API uses string keys like:
 * "ves.io.schema.rules.uint32.gte": "1"
 */
export interface VesValidationRules {
  // New format with full dotted keys
  [key: string]: string | number | boolean | VesValidationRulesLegacy | undefined;
}

/**
 * Legacy nested format (not currently used by API but kept for compatibility)
 */
export interface VesValidationRulesLegacy {
  uint32?: {
    gte?: number;
    lte?: number;
    ranges?: string; // e.g., "0,10-50"
  };
  uint64?: {
    gte?: number;
    lte?: number;
  };
  string?: {
    min_len?: number;
    max_len?: number;
    pattern?: string;
    hex?: boolean;
    ipv4?: boolean;
    ipv6?: boolean;
    hostname?: boolean;
  };
  repeated?: {
    min_items?: number;
    max_items?: number;
  };
  map?: {
    max_pairs?: number;
    keys?: { min_len?: number; max_len?: number };
    values?: { min_len?: number; max_len?: number };
  };
}

/**
 * F5 XC constraints extension
 */
export interface F5XCConstraints {
  number?: {
    minimum?: number;
    maximum?: number;
  };
  string?: {
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Resource type to API schema name mapping
 */
export const RESOURCE_SCHEMA_MAPPING: Record<string, string[]> = {
  // Original 4 resources
  healthcheck: [
    'healthcheckCreateSpecType',
    'healthcheckHttpHealthCheck',
    'healthcheckTcpHealthCheck',
    'healthcheckGetSpecType',
  ],
  origin_pool: [
    'origin_poolCreateSpecType',
    'origin_poolOriginServerType',
    'origin_poolOriginServerPublicName',
    'origin_poolOriginServerK8SService',
    'origin_poolOriginServerPrivateIP',
    'origin_poolOriginServerPublicIP',
    'origin_poolOriginServerConsulService',
  ],
  app_firewall: [
    'app_firewallCreateSpecType',
    'app_firewallGetSpecType',
    'app_firewallAIRiskBasedBlocking',
    'app_firewallDetectionSettings',
    'app_firewallBlockingPage',
    'app_firewallBotProtectionSetting',
  ],
  service_policy: [
    'service_policyCreateSpecType',
    'service_policyGetSpecType',
    'service_policyRule',
    'service_policyRuleSpec',
  ],

  // API Security resources (6 new)
  api_definition: [
    'api_definitionCreateSpecType',
    'api_definitionGetSpecType',
    'api_definitionSpecType',
    'api_definitionSwaggerSpec',
  ],
  api_discovery: [
    'api_discoveryCreateSpecType',
    'api_discoveryGetSpecType',
    'api_discoverySpecType',
    'api_discoveryLearnConfig',
  ],
  api_groups: [
    'api_groupsCreateSpecType',
    'api_groupsGetSpecType',
    'api_groupsSpecType',
    'api_groupsApiEndpoint',
  ],
  code_base_integration: [
    'code_base_integrationCreateSpecType',
    'code_base_integrationGetSpecType',
    'code_base_integrationSpecType',
    'code_base_integrationGitHubConfig',
    'code_base_integrationGitHubEnterpriseConfig',
    'code_base_integrationGitLabConfig',
    'code_base_integrationGitLabEnterpriseConfig',
    'code_base_integrationBitBucketCloudConfig',
    'code_base_integrationBitBucketServerConfig',
    'code_base_integrationAzureReposConfig',
  ],
  data_type: [
    'data_typeCreateSpecType',
    'data_typeGetSpecType',
    'data_typeSpecType',
    'data_typeDetectionRule',
  ],
  sensitive_data_policy: [
    'sensitive_data_policyCreateSpecType',
    'sensitive_data_policyGetSpecType',
    'sensitive_data_policySpecType',
    'sensitive_data_policyDataTypeRef',
  ],
};

/**
 * Download file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, { headers: { 'User-Agent': 'F5XC-Console-Validator' } }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

/**
 * GitHub repository for enriched API specs with live API validation
 */
const GITHUB_REPO = 'robinmordasiewicz/f5xc-api-enriched';
const FALLBACK_VERSION = 'v2.0.46';

/**
 * Get latest release version from GitHub
 */
async function getLatestRelease(): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'F5XC-Console-Validator',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    https.get(options, (response) => {
      let data = '';
      response.on('data', (chunk) => (data += chunk));
      response.on('end', () => {
        try {
          const release = JSON.parse(data);
          resolve(release.tag_name || FALLBACK_VERSION);
        } catch {
          resolve(FALLBACK_VERSION); // Fallback version
        }
      });
    }).on('error', () => {
      resolve(FALLBACK_VERSION); // Fallback version
    });
  });
}

/**
 * Export getLatestRelease for external use
 */
export { getLatestRelease };

/**
 * Download F5 XC API spec from f5xc-api-enriched releases
 *
 * Downloads the ZIP release asset and extracts openapi.json.
 * The spec includes live API validation, so no local live API validation required.
 */
export async function downloadApiSpec(version?: string): Promise<string> {
  const cacheDir = '/tmp/f5xc-api-spec';
  const resolvedVersion = version || (await getLatestRelease());
  const versionDir = path.join(cacheDir, resolvedVersion);
  const specPath = path.join(versionDir, 'openapi.json');

  // Check if already cached
  if (fs.existsSync(specPath)) {
    console.log(`📦 Using cached API spec: ${resolvedVersion}`);
    return specPath;
  }

  // Create cache directory
  fs.mkdirSync(versionDir, { recursive: true });

  // Download the release ZIP asset
  // ZIP naming pattern: f5xc-api-specs-{version}.zip
  const zipUrl = `https://github.com/${GITHUB_REPO}/releases/download/${resolvedVersion}/f5xc-api-specs-${resolvedVersion}.zip`;
  const zipPath = path.join(versionDir, 'api-spec.zip');

  console.log(`📥 Downloading API spec ${resolvedVersion} from ${GITHUB_REPO}...`);

  try {
    await downloadFile(zipUrl, zipPath);

    // Extract using shell unzip command
    console.log(`📂 Extracting API spec...`);
    execSync(`unzip -o "${zipPath}" -d "${versionDir}"`, { stdio: 'pipe' });

    // Find the openapi.json file (may be in root or nested directory)
    const files = fs.readdirSync(versionDir);
    let openapiFile = files.find((f) => f === 'openapi.json');

    if (!openapiFile) {
      // Check for nested directory (common in GitHub release zips)
      const subdirs = files.filter((f) => fs.statSync(path.join(versionDir, f)).isDirectory());
      for (const subdir of subdirs) {
        const nestedPath = path.join(versionDir, subdir, 'openapi.json');
        if (fs.existsSync(nestedPath)) {
          fs.renameSync(nestedPath, specPath);
          openapiFile = 'openapi.json';
          break;
        }
      }
    } else {
      const extractedPath = path.join(versionDir, openapiFile);
      if (extractedPath !== specPath) {
        fs.renameSync(extractedPath, specPath);
      }
    }

    // Clean up zip file
    fs.unlinkSync(zipPath);

    if (!fs.existsSync(specPath)) {
      throw new Error('openapi.json not found in release archive');
    }

    // Verify the extracted file is valid JSON
    const content = fs.readFileSync(specPath, 'utf-8');
    JSON.parse(content); // Throws if invalid

    console.log(`✅ API spec downloaded: ${specPath}`);
    return specPath;
  } catch (error) {
    // Clean up partial download
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    // Fallback: try to use local copy if available
    const localFallback = path.join(process.cwd(), 'api-spec', 'openapi.json');
    if (fs.existsSync(localFallback)) {
      console.log(`⚠️ Using local fallback API spec`);
      return localFallback;
    }
    throw error;
  }
}

/**
 * Load and parse OpenAPI spec
 */
export function loadOpenAPISpec(specPath: string): OpenAPISchema {
  const content = fs.readFileSync(specPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Resolve $ref references in schema
 */
export function resolveRef(
  ref: string,
  openapi: OpenAPISchema
): APISchemaDefinition | undefined {
  // Format: #/components/schemas/SchemaName
  const match = ref.match(/^#\/components\/schemas\/(.+)$/);
  if (!match) return undefined;

  const schemaName = match[1];
  return openapi.components.schemas[schemaName];
}

/**
 * Load API schema for a specific resource type
 */
export function loadApiSchema(
  resourceType: string,
  openapi: OpenAPISchema
): Record<string, APISchemaDefinition> {
  const schemaNames = RESOURCE_SCHEMA_MAPPING[resourceType];
  if (!schemaNames) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  const schemas: Record<string, APISchemaDefinition> = {};

  for (const schemaName of schemaNames) {
    // Try exact match first
    if (openapi.components.schemas[schemaName]) {
      schemas[schemaName] = openapi.components.schemas[schemaName];
      continue;
    }

    // Try case-insensitive search
    const lowerName = schemaName.toLowerCase();
    for (const [key, value] of Object.entries(openapi.components.schemas)) {
      if (key.toLowerCase() === lowerName) {
        schemas[schemaName] = value;
        break;
      }
    }

    // Try partial match
    if (!schemas[schemaName]) {
      for (const [key, value] of Object.entries(openapi.components.schemas)) {
        if (key.toLowerCase().includes(lowerName.replace(/_/g, ''))) {
          schemas[schemaName] = value;
          break;
        }
      }
    }
  }

  return schemas;
}

/**
 * Get all available schema names from OpenAPI spec
 */
export function getAvailableSchemas(openapi: OpenAPISchema): string[] {
  return Object.keys(openapi.components.schemas);
}

/**
 * Parse ves validation rules from the dotted key format
 * e.g., "ves.io.schema.rules.uint32.gte": "1"
 */
function parseVesRules(ves: VesValidationRules): {
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
} {
  const rules: ReturnType<typeof parseVesRules> = {};

  for (const [key, value] of Object.entries(ves)) {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : (typeof value === 'number' ? value : undefined);

    // uint32/uint64 constraints
    if (key.includes('uint32.gte') || key.includes('uint64.gte')) {
      if (numValue !== undefined && !isNaN(numValue)) {
        rules.minimum = numValue;
      }
    } else if (key.includes('uint32.lte') || key.includes('uint64.lte')) {
      if (numValue !== undefined && !isNaN(numValue)) {
        rules.maximum = numValue;
      }
    }
    // string constraints
    else if (key.includes('string.min_len')) {
      if (numValue !== undefined && !isNaN(numValue)) {
        rules.minLength = numValue;
      }
    } else if (key.includes('string.max_len')) {
      if (numValue !== undefined && !isNaN(numValue)) {
        rules.maxLength = numValue;
      }
    }
    // repeated (array) constraints
    else if (key.includes('repeated.min_items')) {
      if (numValue !== undefined && !isNaN(numValue)) {
        rules.minItems = numValue;
      }
    } else if (key.includes('repeated.max_items')) {
      if (numValue !== undefined && !isNaN(numValue)) {
        rules.maxItems = numValue;
      }
    }
    // map constraints (for maxItems on object types)
    else if (key.includes('map.max_pairs')) {
      if (numValue !== undefined && !isNaN(numValue)) {
        rules.maxItems = numValue;
      }
    }
  }

  return rules;
}

/**
 * Extract validation rules from a property
 */
export function extractValidationRules(
  prop: APIPropertyDefinition
): {
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  enum?: string[];
} {
  const rules: ReturnType<typeof extractValidationRules> = {};

  // Ves validation rules extension (primary source of truth for F5 XC)
  // These are more specific than JSON Schema defaults
  const ves = prop['x-ves-validation-rules'];
  if (ves) {
    const vesRules = parseVesRules(ves);
    if (vesRules.minimum !== undefined) rules.minimum = vesRules.minimum;
    if (vesRules.maximum !== undefined) rules.maximum = vesRules.maximum;
    if (vesRules.minLength !== undefined) rules.minLength = vesRules.minLength;
    if (vesRules.maxLength !== undefined) rules.maxLength = vesRules.maxLength;
    if (vesRules.minItems !== undefined) rules.minItems = vesRules.minItems;
    if (vesRules.maxItems !== undefined) rules.maxItems = vesRules.maxItems;
    if (vesRules.pattern) rules.pattern = vesRules.pattern;
  }

  // Also check x-validation-rules (alternate format)
  const xval = (prop as any)['x-validation-rules'] as VesValidationRules | undefined;
  if (xval) {
    const xvalRules = parseVesRules(xval);
    // Only set if not already set by ves rules
    if (xvalRules.minimum !== undefined && rules.minimum === undefined) rules.minimum = xvalRules.minimum;
    if (xvalRules.maximum !== undefined && rules.maximum === undefined) rules.maximum = xvalRules.maximum;
    if (xvalRules.minLength !== undefined && rules.minLength === undefined) rules.minLength = xvalRules.minLength;
    if (xvalRules.maxLength !== undefined && rules.maxLength === undefined) rules.maxLength = xvalRules.maxLength;
    if (xvalRules.minItems !== undefined && rules.minItems === undefined) rules.minItems = xvalRules.minItems;
    if (xvalRules.maxItems !== undefined && rules.maxItems === undefined) rules.maxItems = xvalRules.maxItems;
  }

  // Direct JSON Schema properties (fallback if not in vendor extensions)
  // Note: For F5 XC, the min/max are often set to 0/2147483647 as placeholders,
  // so we prefer vendor extension values when available
  if (rules.minimum === undefined && prop.minimum !== undefined && prop.minimum > 0) {
    rules.minimum = prop.minimum;
  }
  if (rules.maximum === undefined && prop.maximum !== undefined && prop.maximum < 2147483647) {
    rules.maximum = prop.maximum;
  }
  if (rules.minLength === undefined && prop.minLength !== undefined) {
    rules.minLength = prop.minLength;
  }
  if (rules.maxLength === undefined && prop.maxLength !== undefined) {
    rules.maxLength = prop.maxLength;
  }
  if (rules.minItems === undefined && prop.minItems !== undefined) {
    rules.minItems = prop.minItems;
  }
  if (rules.maxItems === undefined && prop.maxItems !== undefined) {
    rules.maxItems = prop.maxItems;
  }
  if (prop.pattern) rules.pattern = prop.pattern;
  if (prop.enum) rules.enum = prop.enum;

  return rules;
}

/**
 * Find a property in API schemas by path
 */
export function findPropertyByPath(
  schemas: Record<string, APISchemaDefinition>,
  propertyPath: string,
  openapi: OpenAPISchema
): APIPropertyDefinition | undefined {
  // Parse path like "spec.timeout" or "spec.http_health_check.path"
  const parts = propertyPath.split('.');

  for (const schema of Object.values(schemas)) {
    let current: APIPropertyDefinition | APISchemaDefinition | undefined = schema;

    for (const part of parts) {
      if (!current) break;

      // Skip 'spec' as it's the root
      if (part === 'spec') continue;

      // Handle array notation like "origin_servers[]"
      const cleanPart = part.replace(/\[\]$/, '');

      // Check properties
      if ('properties' in current && current.properties?.[cleanPart]) {
        current = current.properties[cleanPart];
      } else if ('$ref' in current && current.$ref) {
        // Resolve reference and continue
        const resolved = resolveRef(current.$ref, openapi);
        if (resolved?.properties?.[cleanPart]) {
          current = resolved.properties[cleanPart];
        } else {
          current = undefined;
        }
      } else if ('items' in current && current.items) {
        // Array items
        if (current.items.properties?.[cleanPart]) {
          current = current.items.properties[cleanPart];
        } else if (current.items.$ref) {
          const resolved = resolveRef(current.items.$ref, openapi);
          if (resolved?.properties?.[cleanPart]) {
            current = resolved.properties[cleanPart];
          } else {
            current = undefined;
          }
        } else {
          current = undefined;
        }
      } else {
        current = undefined;
      }
    }

    if (current) {
      return current as APIPropertyDefinition;
    }
  }

  return undefined;
}
