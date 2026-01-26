// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * F5 XC Resource Definitions Index
 *
 * Central export for all F5 XC resource type definitions.
 * Each definition provides declarative schema generation from
 * live F5 XC Console form data.
 */

// Shared utilities and common fields
export * from './shared/api-security-common';

// Original resource definitions (4)
export { appFirewallDefinition } from './app_firewall.definition';
export { healthcheckDefinition } from './healthcheck.definition';
export { originPoolDefinition } from './origin_pool.definition';
export { servicePolicyDefinition } from './service_policy.definition';

// New API security resource definitions (6)
export { apiDefinitionDefinition } from './api_definition.definition';
export { apiDiscoveryDefinition } from './api_discovery.definition';
export { apiGroupsDefinition } from './api_groups.definition';
export { codeBaseIntegrationDefinition } from './code_base_integration.definition';
export { dataTypeDefinition } from './data_type.definition';
export { sensitiveDataPolicyDefinition } from './sensitive_data_policy.definition';

// Import all definitions for convenience
import { appFirewallDefinition } from './app_firewall.definition';
import { healthcheckDefinition } from './healthcheck.definition';
import { originPoolDefinition } from './origin_pool.definition';
import { servicePolicyDefinition } from './service_policy.definition';
import { apiDefinitionDefinition } from './api_definition.definition';
import { apiDiscoveryDefinition } from './api_discovery.definition';
import { apiGroupsDefinition } from './api_groups.definition';
import { codeBaseIntegrationDefinition } from './code_base_integration.definition';
import { dataTypeDefinition } from './data_type.definition';
import { sensitiveDataPolicyDefinition } from './sensitive_data_policy.definition';
import { ResourceDefinition } from '../extractors/resource-definition';

/**
 * All resource definitions as an array for batch processing
 */
export const ALL_DEFINITIONS: ResourceDefinition[] = [
  // Original resources
  appFirewallDefinition,
  healthcheckDefinition,
  originPoolDefinition,
  servicePolicyDefinition,
  // New API security resources
  apiDefinitionDefinition,
  apiDiscoveryDefinition,
  apiGroupsDefinition,
  codeBaseIntegrationDefinition,
  dataTypeDefinition,
  sensitiveDataPolicyDefinition,
];

/**
 * Definition lookup by resource type
 */
export const DEFINITIONS_BY_TYPE: Record<string, ResourceDefinition> = {
  app_firewall: appFirewallDefinition,
  healthcheck: healthcheckDefinition,
  origin_pool: originPoolDefinition,
  service_policy: servicePolicyDefinition,
  api_definition: apiDefinitionDefinition,
  api_discovery: apiDiscoveryDefinition,
  api_groups: apiGroupsDefinition,
  code_base_integration: codeBaseIntegrationDefinition,
  data_type: dataTypeDefinition,
  sensitive_data_policy: sensitiveDataPolicyDefinition,
};

/**
 * Get definition by resource type name
 */
export function getDefinition(resourceType: string): ResourceDefinition | undefined {
  return DEFINITIONS_BY_TYPE[resourceType];
}

/**
 * List all available resource types
 */
export function listResourceTypes(): string[] {
  return Object.keys(DEFINITIONS_BY_TYPE);
}
