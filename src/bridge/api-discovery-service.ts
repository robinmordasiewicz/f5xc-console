// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * API Discovery Service
 *
 * Provides live API integration with F5 Distributed Cloud (XC) for dynamic enum population.
 * Replaces placeholder enums with actual resource names from tenant.
 *
 * Phase 3 feature: Enables discovery of healthchecks, origin pools, and other resources
 * for dropdown field population.
 *
 * Usage:
 * ```typescript
 * const service = new ApiDiscoveryService({
 *   tenant: 'my-tenant',
 *   apiToken: process.env.F5XC_API_TOKEN!,
 *   apiBaseUrl: 'https://my-tenant.console.ves.volterra.io/api'
 * });
 *
 * const healthchecks = await service.fetchReferenceOptions('healthcheck', 'default');
 * // Returns: [{ value: 'hc-1', label: 'hc-1' }, { value: 'hc-2', label: 'hc-2' }]
 * ```
 */

import * as https from 'https';
import * as http from 'http';

/**
 * F5 XC API credentials configuration
 */
export interface F5XCCredentials {
  /** F5 XC tenant name (e.g., 'my-company-prod') */
  tenant: string;
  /** API token for authentication */
  apiToken: string;
  /** Optional custom API base URL (defaults to standard F5 XC endpoint) */
  apiBaseUrl?: string;
  /** Optional namespace (defaults to 'default') */
  namespace?: string;
}

/**
 * Reference option for dropdown field
 */
export interface ReferenceOption {
  /** Value to submit to API (e.g., resource name) */
  value: string;
  /** Human-readable label for UI (e.g., resource name or description) */
  label: string;
  /** Optional metadata (namespace, creation time, etc.) */
  metadata?: Record<string, any>;
}

/**
 * Cached API response with TTL
 */
interface CachedResponse {
  /** Cache key (resourceType:namespace) */
  key: string;
  /** Cached options */
  options: ReferenceOption[];
  /** Timestamp when cached (ms since epoch) */
  cachedAt: number;
  /** Time-to-live in seconds */
  ttl: number;
}

/**
 * API Discovery Service configuration
 */
export interface ApiDiscoveryConfig {
  /** F5 XC credentials */
  credentials: F5XCCredentials;
  /** Cache TTL in seconds (default: 300 = 5 minutes) */
  cacheTtl?: number;
  /** Enable API discovery (default: true, can disable for testing) */
  enabled?: boolean;
  /** Fallback to placeholders on API failure (default: true) */
  fallbackToPlaceholders?: boolean;
  /** Request timeout in ms (default: 10000 = 10 seconds) */
  requestTimeout?: number;
}

/**
 * API Discovery Service
 *
 * Fetches resource options from F5 XC API for dynamic enum population
 */
export class ApiDiscoveryService {
  private credentials: F5XCCredentials;
  private cacheTtl: number;
  private enabled: boolean;
  private fallbackToPlaceholders: boolean;
  private requestTimeout: number;
  private cache: Map<string, CachedResponse> = new Map();

  constructor(config: ApiDiscoveryConfig) {
    this.credentials = config.credentials;
    this.cacheTtl = config.cacheTtl ?? 300; // 5 minutes default
    this.enabled = config.enabled ?? true;
    this.fallbackToPlaceholders = config.fallbackToPlaceholders ?? true;
    this.requestTimeout = config.requestTimeout ?? 10000; // 10 seconds default
  }

  /**
   * Fetch reference options for a resource type
   *
   * @param resourceType - Resource type (e.g., 'healthcheck', 'origin_pool')
   * @param namespace - Namespace (defaults to credentials.namespace or 'default')
   * @returns Array of reference options
   */
  async fetchReferenceOptions(
    resourceType: string,
    namespace?: string
  ): Promise<ReferenceOption[]> {
    if (!this.enabled) {
      console.warn('API discovery disabled, using placeholders');
      return this.generatePlaceholder(resourceType);
    }

    const ns = namespace ?? this.credentials.namespace ?? 'default';
    const cacheKey = `${resourceType}:${ns}`;

    // Check cache
    const cached = this.getCachedOptions(cacheKey);
    if (cached) {
      console.log(`Cache HIT: ${cacheKey} (age: ${this.getCacheAge(cacheKey)}s)`);
      return cached;
    }

    console.log(`Cache MISS: ${cacheKey}, fetching from API...`);

    try {
      // Fetch from API
      const url = this.buildApiUrl(resourceType, ns);
      const response = await this.apiRequest(url);

      // Transform response to options
      const options = this.transformResponse(response, resourceType);

      // Cache the result
      this.cacheOptions(cacheKey, options);

      console.log(`API SUCCESS: ${cacheKey}, cached ${options.length} options`);
      return options;
    } catch (error) {
      console.error(`API FAILURE: ${cacheKey}`, error instanceof Error ? error.message : String(error));

      if (this.fallbackToPlaceholders) {
        console.warn(`Falling back to placeholder values for ${resourceType}`);
        return this.generatePlaceholder(resourceType);
      }

      throw error;
    }
  }

  /**
   * Build F5 XC API URL for resource type
   *
   * @param resourceType - Resource type
   * @param namespace - Namespace
   * @returns Full API URL
   */
  private buildApiUrl(resourceType: string, namespace: string): string {
    const baseUrl = this.credentials.apiBaseUrl ??
      `https://${this.credentials.tenant}.console.ves.volterra.io/api`;

    // Resource type to API path mapping
    const pathMap: Record<string, string> = {
      healthcheck: 'config/namespaces/{namespace}/healthchecks',
      origin_pool: 'config/namespaces/{namespace}/origin_pools',
      load_balancer: 'config/namespaces/{namespace}/http_loadbalancers',
      app_firewall: 'config/namespaces/{namespace}/app_firewalls',
    };

    const path = pathMap[resourceType] ?? `config/namespaces/{namespace}/${resourceType}s`;
    const fullPath = path.replace('{namespace}', namespace);

    return `${baseUrl}/${fullPath}`;
  }

  /**
   * Make HTTP request to F5 XC API
   *
   * @param url - API URL
   * @returns Parsed JSON response
   */
  private apiRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'Authorization': `APIToken ${this.credentials.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: this.requestTimeout,
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`));
            }
          } else if (res.statusCode === 401) {
            reject(new Error(`Authentication failed: Invalid API token`));
          } else if (res.statusCode === 403) {
            reject(new Error(`Access denied: Insufficient permissions`));
          } else if (res.statusCode === 404) {
            reject(new Error(`Resource not found: ${url}`));
          } else if (res.statusCode === 429) {
            reject(new Error(`Rate limit exceeded: Too many requests`));
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.requestTimeout}ms`));
      });

      req.end();
    });
  }

  /**
   * Transform F5 XC API response to reference options
   *
   * @param response - Raw API response
   * @param resourceType - Resource type
   * @returns Array of reference options
   */
  private transformResponse(response: any, resourceType: string): ReferenceOption[] {
    const options: ReferenceOption[] = [];

    // F5 XC API typically returns { items: [...] }
    const items = response.items ?? [];

    for (const item of items) {
      // Extract metadata.name as the resource identifier
      const name = item.metadata?.name ?? item.name;
      if (!name) continue;

      options.push({
        value: name,
        label: name,
        metadata: {
          namespace: item.metadata?.namespace,
          creationTime: item.metadata?.creation_timestamp,
          resourceType,
        },
      });
    }

    return options;
  }

  /**
   * Get cached options if still valid
   *
   * @param cacheKey - Cache key
   * @returns Cached options or null if expired/missing
   */
  private getCachedOptions(cacheKey: string): ReferenceOption[] | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const age = (Date.now() - cached.cachedAt) / 1000;
    if (age > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.options;
  }

  /**
   * Cache options with TTL
   *
   * @param cacheKey - Cache key
   * @param options - Options to cache
   */
  private cacheOptions(cacheKey: string, options: ReferenceOption[]): void {
    this.cache.set(cacheKey, {
      key: cacheKey,
      options,
      cachedAt: Date.now(),
      ttl: this.cacheTtl,
    });
  }

  /**
   * Get cache age in seconds
   *
   * @param cacheKey - Cache key
   * @returns Age in seconds or -1 if not cached
   */
  private getCacheAge(cacheKey: string): number {
    const cached = this.cache.get(cacheKey);
    if (!cached) return -1;
    return Math.floor((Date.now() - cached.cachedAt) / 1000);
  }

  /**
   * Generate placeholder options when API is unavailable
   *
   * @param resourceType - Resource type
   * @returns Placeholder options
   */
  private generatePlaceholder(resourceType: string): ReferenceOption[] {
    const placeholders: Record<string, string[]> = {
      healthcheck: ['healthcheck-1', 'healthcheck-2', 'example-hc'],
      origin_pool: ['origin-pool-1', 'origin-pool-2', 'example-pool'],
      load_balancer: ['lb-1', 'lb-2', 'example-lb'],
      app_firewall: ['app-firewall-1', 'app-firewall-2', 'example-waf'],
    };

    const values = placeholders[resourceType] ?? [`${resourceType}-placeholder`];

    return values.map(value => ({
      value,
      label: `${value} (placeholder)`,
      metadata: { isPlaceholder: true },
    }));
  }

  /**
   * Clear all cached options
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Check if API discovery is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable API discovery
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

/**
 * Create API discovery service from environment variables
 *
 * Expects:
 * - F5XC_TENANT: Tenant name
 * - F5XC_API_TOKEN: API token
 * - F5XC_NAMESPACE: (optional) Default namespace
 * - F5XC_API_BASE_URL: (optional) Custom API URL
 * - F5XC_CACHE_TTL: (optional) Cache TTL in seconds
 *
 * @returns Configured API discovery service or null if credentials missing
 */
export function createApiDiscoveryFromEnv(): ApiDiscoveryService | null {
  const tenant = process.env.F5XC_TENANT;
  const apiToken = process.env.F5XC_API_TOKEN;

  if (!tenant || !apiToken) {
    console.warn('F5XC_TENANT or F5XC_API_TOKEN not set, API discovery disabled');
    return null;
  }

  const config: ApiDiscoveryConfig = {
    credentials: {
      tenant,
      apiToken,
      apiBaseUrl: process.env.F5XC_API_BASE_URL,
      namespace: process.env.F5XC_NAMESPACE ?? 'default',
    },
    cacheTtl: process.env.F5XC_CACHE_TTL ? parseInt(process.env.F5XC_CACHE_TTL) : 300,
    enabled: process.env.F5XC_API_DISCOVERY_ENABLED !== 'false',
    fallbackToPlaceholders: process.env.F5XC_FALLBACK_PLACEHOLDERS !== 'false',
  };

  return new ApiDiscoveryService(config);
}
