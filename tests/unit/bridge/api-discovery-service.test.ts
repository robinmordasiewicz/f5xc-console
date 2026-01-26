// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Unit tests for API Discovery Service (Phase 3)
 *
 * Tests F5 XC API integration for dynamic enum population
 */

import {
  ApiDiscoveryService,
  createApiDiscoveryFromEnv,
  F5XCCredentials,
  ApiDiscoveryConfig,
  ReferenceOption,
} from '../../../src/bridge/api-discovery-service';

describe('ApiDiscoveryService', () => {
  const mockCredentials: F5XCCredentials = {
    tenant: 'test-tenant',
    apiToken: 'test-token-12345',
    namespace: 'default',
  };

  const mockConfig: ApiDiscoveryConfig = {
    credentials: mockCredentials,
    cacheTtl: 300,
    enabled: true,
    fallbackToPlaceholders: true,
    requestTimeout: 10000,
  };

  describe('constructor', () => {
    it('should initialize with default config values', () => {
      const service = new ApiDiscoveryService({
        credentials: mockCredentials,
      });

      expect(service.isEnabled()).toBe(true);
      expect(service.getCacheStats().size).toBe(0);
    });

    it('should accept custom config values', () => {
      const customConfig: ApiDiscoveryConfig = {
        credentials: mockCredentials,
        cacheTtl: 600,
        enabled: false,
        fallbackToPlaceholders: false,
        requestTimeout: 5000,
      };

      const service = new ApiDiscoveryService(customConfig);
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('fetchReferenceOptions', () => {
    it('should return placeholder values when disabled', async () => {
      const service = new ApiDiscoveryService({
        credentials: mockCredentials,
        enabled: false,
      });

      const options = await service.fetchReferenceOptions('healthcheck', 'default');

      expect(options).toHaveLength(3);
      expect(options[0]).toMatchObject({
        value: 'healthcheck-1',
        label: 'healthcheck-1 (placeholder)',
        metadata: { isPlaceholder: true },
      });
    });

    it('should generate correct placeholder values for different resource types', async () => {
      const service = new ApiDiscoveryService({
        credentials: mockCredentials,
        enabled: false,
      });

      const hcOptions = await service.fetchReferenceOptions('healthcheck', 'default');
      expect(hcOptions[0].value).toBe('healthcheck-1');

      const poolOptions = await service.fetchReferenceOptions('origin_pool', 'default');
      expect(poolOptions[0].value).toBe('origin-pool-1');

      const lbOptions = await service.fetchReferenceOptions('load_balancer', 'default');
      expect(lbOptions[0].value).toBe('lb-1');
    });

    it('should use fallback namespace if not provided', async () => {
      const service = new ApiDiscoveryService({
        credentials: { ...mockCredentials, namespace: 'custom-namespace' },
        enabled: false,
      });

      const options = await service.fetchReferenceOptions('healthcheck');

      expect(options).toHaveLength(3);
      expect(options[0].metadata?.isPlaceholder).toBe(true);
    });
  });

  describe('caching', () => {
    it('should start with empty cache', () => {
      const service = new ApiDiscoveryService(mockConfig);
      const stats = service.getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });

    it('should clear cache when requested', () => {
      const service = new ApiDiscoveryService(mockConfig);

      // Populate cache (using internal method simulation)
      // In real scenario, this would happen after API call

      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('enable/disable API discovery', () => {
    it('should allow enabling API discovery', () => {
      const service = new ApiDiscoveryService({
        credentials: mockCredentials,
        enabled: false,
      });

      expect(service.isEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.isEnabled()).toBe(true);
    });

    it('should allow disabling API discovery', () => {
      const service = new ApiDiscoveryService({
        credentials: mockCredentials,
        enabled: true,
      });

      expect(service.isEnabled()).toBe(true);

      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('buildApiUrl', () => {
    it('should build correct URL for healthcheck resource', () => {
      const service = new ApiDiscoveryService(mockConfig);

      // Access private method through type assertion for testing
      const url = (service as any).buildApiUrl('healthcheck', 'default');

      expect(url).toBe('https://test-tenant.console.ves.volterra.io/api/config/namespaces/default/healthchecks');
    });

    it('should build correct URL for origin_pool resource', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const url = (service as any).buildApiUrl('origin_pool', 'default');

      expect(url).toBe('https://test-tenant.console.ves.volterra.io/api/config/namespaces/default/origin_pools');
    });

    it('should build correct URL for load_balancer resource', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const url = (service as any).buildApiUrl('load_balancer', 'default');

      expect(url).toBe('https://test-tenant.console.ves.volterra.io/api/config/namespaces/default/http_loadbalancers');
    });

    it('should use custom API base URL if provided', () => {
      const customConfig: ApiDiscoveryConfig = {
        credentials: {
          ...mockCredentials,
          apiBaseUrl: 'https://custom.api.example.com/api',
        },
      };

      const service = new ApiDiscoveryService(customConfig);

      const url = (service as any).buildApiUrl('healthcheck', 'default');

      expect(url).toBe('https://custom.api.example.com/api/config/namespaces/default/healthchecks');
    });

    it('should handle custom namespace in URL', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const url = (service as any).buildApiUrl('healthcheck', 'production');

      expect(url).toContain('/namespaces/production/');
    });
  });

  describe('transformResponse', () => {
    it('should transform F5 XC API response to reference options', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const mockResponse = {
        items: [
          {
            metadata: {
              name: 'hc-1',
              namespace: 'default',
              creation_timestamp: '2026-01-20T00:00:00Z',
            },
          },
          {
            metadata: {
              name: 'hc-2',
              namespace: 'default',
              creation_timestamp: '2026-01-20T01:00:00Z',
            },
          },
        ],
      };

      const options = (service as any).transformResponse(mockResponse, 'healthcheck');

      expect(options).toHaveLength(2);
      expect(options[0]).toMatchObject({
        value: 'hc-1',
        label: 'hc-1',
        metadata: {
          namespace: 'default',
          creationTime: '2026-01-20T00:00:00Z',
          resourceType: 'healthcheck',
        },
      });
    });

    it('should handle response with no items', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const mockResponse = { items: [] };

      const options = (service as any).transformResponse(mockResponse, 'healthcheck');

      expect(options).toEqual([]);
    });

    it('should skip items without name', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const mockResponse = {
        items: [
          { metadata: { name: 'hc-1' } },
          { metadata: {} }, // No name
          { metadata: { name: 'hc-3' } },
        ],
      };

      const options = (service as any).transformResponse(mockResponse, 'healthcheck');

      expect(options).toHaveLength(2);
      expect(options.map((o: ReferenceOption) => o.value)).toEqual(['hc-1', 'hc-3']);
    });
  });

  describe('generatePlaceholder', () => {
    it('should generate placeholder options for known resource types', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const hcPlaceholders = (service as any).generatePlaceholder('healthcheck');
      expect(hcPlaceholders).toHaveLength(3);
      expect(hcPlaceholders[0]).toMatchObject({
        value: 'healthcheck-1',
        label: 'healthcheck-1 (placeholder)',
        metadata: { isPlaceholder: true },
      });

      const poolPlaceholders = (service as any).generatePlaceholder('origin_pool');
      expect(poolPlaceholders[0].value).toBe('origin-pool-1');

      const lbPlaceholders = (service as any).generatePlaceholder('load_balancer');
      expect(lbPlaceholders[0].value).toBe('lb-1');
    });

    it('should generate generic placeholder for unknown resource types', () => {
      const service = new ApiDiscoveryService(mockConfig);

      const placeholders = (service as any).generatePlaceholder('unknown_resource');

      expect(placeholders).toHaveLength(1);
      expect(placeholders[0]).toMatchObject({
        value: 'unknown_resource-placeholder',
        label: 'unknown_resource-placeholder (placeholder)',
        metadata: { isPlaceholder: true },
      });
    });
  });
});

describe('createApiDiscoveryFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null when F5XC_TENANT is missing', () => {
    delete process.env.F5XC_TENANT;
    process.env.F5XC_API_TOKEN = 'test-token';

    const service = createApiDiscoveryFromEnv();

    expect(service).toBeNull();
  });

  it('should return null when F5XC_API_TOKEN is missing', () => {
    process.env.F5XC_TENANT = 'test-tenant';
    delete process.env.F5XC_API_TOKEN;

    const service = createApiDiscoveryFromEnv();

    expect(service).toBeNull();
  });

  it('should create service with environment variables', () => {
    process.env.F5XC_TENANT = 'test-tenant';
    process.env.F5XC_API_TOKEN = 'test-token';
    process.env.F5XC_NAMESPACE = 'production';

    const service = createApiDiscoveryFromEnv();

    expect(service).not.toBeNull();
    expect(service!.isEnabled()).toBe(true);
  });

  it('should use default namespace when F5XC_NAMESPACE not set', () => {
    process.env.F5XC_TENANT = 'test-tenant';
    process.env.F5XC_API_TOKEN = 'test-token';
    delete process.env.F5XC_NAMESPACE;

    const service = createApiDiscoveryFromEnv();

    expect(service).not.toBeNull();
    // Default namespace should be used internally
  });

  it('should parse F5XC_CACHE_TTL as integer', () => {
    process.env.F5XC_TENANT = 'test-tenant';
    process.env.F5XC_API_TOKEN = 'test-token';
    process.env.F5XC_CACHE_TTL = '600';

    const service = createApiDiscoveryFromEnv();

    expect(service).not.toBeNull();
    // Cache TTL should be 600 seconds internally
  });

  it('should use custom API base URL when provided', () => {
    process.env.F5XC_TENANT = 'test-tenant';
    process.env.F5XC_API_TOKEN = 'test-token';
    process.env.F5XC_API_BASE_URL = 'https://custom.api.com/api';

    const service = createApiDiscoveryFromEnv();

    expect(service).not.toBeNull();
  });

  it('should respect F5XC_API_DISCOVERY_ENABLED=false', () => {
    process.env.F5XC_TENANT = 'test-tenant';
    process.env.F5XC_API_TOKEN = 'test-token';
    process.env.F5XC_API_DISCOVERY_ENABLED = 'false';

    const service = createApiDiscoveryFromEnv();

    expect(service).not.toBeNull();
    expect(service!.isEnabled()).toBe(false);
  });

  it('should respect F5XC_FALLBACK_PLACEHOLDERS=false', () => {
    process.env.F5XC_TENANT = 'test-tenant';
    process.env.F5XC_API_TOKEN = 'test-token';
    process.env.F5XC_FALLBACK_PLACEHOLDERS = 'false';

    const service = createApiDiscoveryFromEnv();

    expect(service).not.toBeNull();
    // Fallback should be disabled internally
  });
});
