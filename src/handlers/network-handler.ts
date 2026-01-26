// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Network Handler
 *
 * Monitors network requests during extraction for debugging and validation.
 * Uses chrome-devtools MCP server's network monitoring capabilities.
 */

import { NetworkRequest } from '../mcp/chrome-devtools-adapter';

/**
 * Request type categories
 */
export type RequestCategory = 'api' | 'resource' | 'navigation' | 'other';

/**
 * Categorized network request
 */
export interface CategorizedRequest {
  /** Request ID */
  reqid: number;
  /** Request URL */
  url: string;
  /** Request method */
  method: string;
  /** Response status */
  status?: number;
  /** Resource type */
  resourceType: string;
  /** Request category */
  category: RequestCategory;
  /** Whether request succeeded */
  success: boolean;
  /** API endpoint (if applicable) */
  apiEndpoint?: string;
}

/**
 * Network monitoring result
 */
export interface NetworkMonitoringResult {
  /** Total requests captured */
  totalRequests: number;
  /** API requests */
  apiRequests: CategorizedRequest[];
  /** Failed requests */
  failedRequests: CategorizedRequest[];
  /** Request counts by type */
  countsByType: Record<string, number>;
  /** Request counts by status */
  countsByStatus: Record<number, number>;
  /** Summary message */
  summary: string;
}

/**
 * Network monitoring options
 */
export interface NetworkMonitorOptions {
  /** Resource types to include */
  resourceTypes?: string[];
  /** URL patterns to track */
  urlPatterns?: string[];
  /** Whether to include successful requests */
  includeSuccessful?: boolean;
  /** Whether to track API calls only */
  apiOnly?: boolean;
}

/**
 * API endpoint patterns for F5 XC Console
 */
const API_PATTERNS = [
  /\/api\/config\//,
  /\/api\/web\//,
  /\/api\/data\//,
  /\/api\/auth\//,
  /\/public\/namespaces\//,
  /\/api\.ves\.volterra\.io\//,
  /\/api\//,  // Generic API pattern (catch-all)
];

/**
 * Resource type categorization
 */
const RESOURCE_CATEGORIES: Record<string, RequestCategory> = {
  xhr: 'api',
  fetch: 'api',
  document: 'navigation',
  script: 'resource',
  stylesheet: 'resource',
  image: 'resource',
  font: 'resource',
  media: 'resource',
  websocket: 'other',
  other: 'other',
};

/**
 * Network Handler Class
 */
export class NetworkHandler {
  private options: Required<NetworkMonitorOptions>;

  constructor(options?: NetworkMonitorOptions) {
    this.options = {
      resourceTypes: options?.resourceTypes ?? ['xhr', 'fetch'],
      urlPatterns: options?.urlPatterns ?? [],
      includeSuccessful: options?.includeSuccessful ?? true,
      apiOnly: options?.apiOnly ?? false,
    };
  }

  /**
   * Generate MCP instruction to list network requests
   */
  generateListRequestsInstruction(
    resourceTypes?: string[]
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (resourceTypes) {
      params.resourceTypes = resourceTypes;
    }

    return {
      tool: 'mcp__chrome-devtools__list_network_requests',
      params,
      description: 'List network requests to monitor API calls',
      expectedOutcome: 'Network requests retrieved',
    };
  }

  /**
   * Generate MCP instruction to get specific network request details
   */
  generateGetRequestInstruction(reqid: number): Record<string, unknown> {
    return {
      tool: 'mcp__chrome-devtools__get_network_request',
      params: { reqid },
      description: `Get network request ${reqid} details`,
      expectedOutcome: 'Request details with headers and body',
    };
  }

  /**
   * Process network requests and categorize
   */
  processRequests(requests: NetworkRequest[]): NetworkMonitoringResult {
    const categorized: CategorizedRequest[] = [];
    const apiRequests: CategorizedRequest[] = [];
    const failedRequests: CategorizedRequest[] = [];
    const countsByType: Record<string, number> = {};
    const countsByStatus: Record<number, number> = {};

    for (const req of requests) {
      // Skip if not matching resource types
      if (
        this.options.resourceTypes.length > 0 &&
        !this.options.resourceTypes.includes(req.resourceType)
      ) {
        continue;
      }

      // Skip if not matching URL patterns
      if (this.options.urlPatterns.length > 0 && !this.matchesUrlPattern(req.url)) {
        continue;
      }

      // Categorize request
      const category = this.categorizeRequest(req);
      const isApi = this.isApiRequest(req.url);
      const success = this.isSuccessful(req.status);

      // Skip if API-only and not an API request
      if (this.options.apiOnly && !isApi) {
        continue;
      }

      // Skip successful requests if not included
      if (!this.options.includeSuccessful && success) {
        continue;
      }

      // Create categorized request
      const categorizedReq: CategorizedRequest = {
        reqid: req.reqid,
        url: req.url,
        method: req.method,
        status: req.status,
        resourceType: req.resourceType,
        category,
        success,
        apiEndpoint: isApi ? this.extractApiEndpoint(req.url) : undefined,
      };

      categorized.push(categorizedReq);

      // Track API requests
      if (isApi) {
        apiRequests.push(categorizedReq);
      }

      // Track failed requests
      if (!success) {
        failedRequests.push(categorizedReq);
      }

      // Count by type
      countsByType[req.resourceType] = (countsByType[req.resourceType] ?? 0) + 1;

      // Count by status
      if (req.status) {
        countsByStatus[req.status] = (countsByStatus[req.status] ?? 0) + 1;
      }
    }

    const summary = this.generateSummary(
      categorized.length,
      apiRequests.length,
      failedRequests.length
    );

    return {
      totalRequests: categorized.length,
      apiRequests,
      failedRequests,
      countsByType,
      countsByStatus,
      summary,
    };
  }

  /**
   * Check if URL matches pattern
   */
  private matchesUrlPattern(url: string): boolean {
    return this.options.urlPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Categorize request
   */
  private categorizeRequest(request: NetworkRequest): RequestCategory {
    return RESOURCE_CATEGORIES[request.resourceType] ?? 'other';
  }

  /**
   * Check if request is an API call
   */
  private isApiRequest(url: string): boolean {
    return API_PATTERNS.some(pattern => pattern.test(url));
  }

  /**
   * Check if response status indicates success
   */
  private isSuccessful(status?: number): boolean {
    if (!status) return false;
    return status >= 200 && status < 400;
  }

  /**
   * Extract API endpoint from URL
   */
  private extractApiEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * Generate summary message
   */
  private generateSummary(
    total: number,
    apiCount: number,
    failedCount: number
  ): string {
    const parts: string[] = [];

    parts.push(`${total} request${total === 1 ? '' : 's'}`);

    if (apiCount > 0) {
      parts.push(`${apiCount} API`);
    }

    if (failedCount > 0) {
      parts.push(`${failedCount} failed`);
    }

    return parts.join(', ');
  }

  /**
   * Format requests for display
   */
  formatRequests(result: NetworkMonitoringResult): string {
    const lines: string[] = [];
    lines.push(`## Network Requests: ${result.summary}`);
    lines.push('');

    if (result.apiRequests.length > 0) {
      lines.push(`### API Requests (${result.apiRequests.length})`);
      lines.push('');

      for (const req of result.apiRequests) {
        const statusMark = req.success ? '✅' : '❌';
        lines.push(`- ${statusMark} ${req.method} ${req.apiEndpoint} (${req.status})`);
      }

      lines.push('');
    }

    if (result.failedRequests.length > 0) {
      lines.push(`### Failed Requests (${result.failedRequests.length})`);
      lines.push('');

      for (const req of result.failedRequests) {
        lines.push(`- ❌ ${req.method} ${req.url} (${req.status ?? 'no status'})`);
      }

      lines.push('');
    }

    if (Object.keys(result.countsByType).length > 0) {
      lines.push('### Request Types');
      lines.push('');

      for (const [type, count] of Object.entries(result.countsByType)) {
        lines.push(`- ${type}: ${count}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Validate that a specific API endpoint was called
   */
  validateApiCall(
    requests: NetworkRequest[],
    endpointPattern: string | RegExp
  ): boolean {
    const pattern =
      typeof endpointPattern === 'string'
        ? new RegExp(endpointPattern)
        : endpointPattern;

    return requests.some(req => {
      if (!this.isApiRequest(req.url)) return false;
      const endpoint = this.extractApiEndpoint(req.url);
      // Test pattern against both "METHOD endpoint" and endpoint alone
      const methodEndpoint = `${req.method} ${endpoint}`;
      return pattern.test(endpoint) || pattern.test(methodEndpoint);
    });
  }

  /**
   * Get all API endpoints called
   */
  getApiEndpoints(requests: NetworkRequest[]): string[] {
    const endpoints = new Set<string>();

    for (const req of requests) {
      if (this.isApiRequest(req.url)) {
        const endpoint = this.extractApiEndpoint(req.url);
        endpoints.add(endpoint);
      }
    }

    return Array.from(endpoints).sort();
  }

  /**
   * Check if any requests failed
   */
  hasFailures(requests: NetworkRequest[]): boolean {
    return requests.some(req => !this.isSuccessful(req.status));
  }

  /**
   * Get failed requests
   */
  getFailedRequests(requests: NetworkRequest[]): NetworkRequest[] {
    return requests.filter(req => !this.isSuccessful(req.status));
  }

  /**
   * Filter to API requests only
   */
  filterApiRequests(requests: NetworkRequest[]): NetworkRequest[] {
    return requests.filter(req => this.isApiRequest(req.url));
  }

  /**
   * Group requests by endpoint
   */
  groupByEndpoint(requests: NetworkRequest[]): Record<string, NetworkRequest[]> {
    const groups: Record<string, NetworkRequest[]> = {};

    for (const req of requests) {
      if (this.isApiRequest(req.url)) {
        const endpoint = this.extractApiEndpoint(req.url);
        const existing = groups[endpoint] ?? [];
        existing.push(req);
        groups[endpoint] = existing;
      }
    }

    return groups;
  }

  /**
   * Detect rate limiting
   */
  detectRateLimiting(requests: NetworkRequest[]): boolean {
    return requests.some(req => req.status === 429);
  }

  /**
   * Detect authentication failures
   */
  detectAuthFailures(requests: NetworkRequest[]): boolean {
    return requests.some(req => req.status === 401 || req.status === 403);
  }
}

/**
 * Singleton instance
 */
let defaultHandler: NetworkHandler | null = null;

/**
 * Get the default network handler instance
 */
export function getNetworkHandler(options?: NetworkMonitorOptions): NetworkHandler {
  if (!defaultHandler) {
    defaultHandler = new NetworkHandler(options);
  }
  return defaultHandler;
}

/**
 * Reset the default handler (useful for testing)
 */
export function resetNetworkHandler(): void {
  defaultHandler = null;
}

/**
 * Quick function to process network requests
 */
export function processNetworkRequests(
  requests: NetworkRequest[]
): NetworkMonitoringResult {
  return getNetworkHandler().processRequests(requests);
}

/**
 * Quick function to check for API calls
 */
export function hasApiCalls(requests: NetworkRequest[]): boolean {
  const result = processNetworkRequests(requests);
  return result.apiRequests.length > 0;
}

/**
 * Quick function to format network requests
 */
export function formatNetworkRequests(requests: NetworkRequest[]): string {
  const result = processNetworkRequests(requests);
  return getNetworkHandler().formatRequests(result);
}

/**
 * Quick function to validate API endpoint was called
 */
export function validateApiEndpoint(
  requests: NetworkRequest[],
  pattern: string | RegExp
): boolean {
  return getNetworkHandler().validateApiCall(requests, pattern);
}
