// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import {
  NetworkHandler,
  getNetworkHandler,
  resetNetworkHandler,
  processNetworkRequests,
  hasApiCalls,
  formatNetworkRequests,
  validateApiEndpoint,
} from '../../../src/handlers/network-handler';
import { NetworkRequest } from '../../../src/mcp/chrome-devtools-adapter';

describe('NetworkHandler', () => {
  let handler: NetworkHandler;

  beforeEach(() => {
    resetNetworkHandler();
    handler = new NetworkHandler();
  });

  describe('processRequests', () => {
    it('should process empty request array', () => {
      const result = handler.processRequests([]);

      expect(result.totalRequests).toBe(0);
      expect(result.apiRequests).toEqual([]);
      expect(result.failedRequests).toEqual([]);
      expect(result.countsByType).toEqual({});
      expect(result.summary).toContain('0 request');
    });

    it('should categorize API requests', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://console.example.com/api/config/namespaces/default/origin_pools',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://console.example.com/api/data/health_status',
          method: 'GET',
          status: 200,
          resourceType: 'fetch',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.totalRequests).toBe(2);
      expect(result.apiRequests).toHaveLength(2);
      expect(result.apiRequests[0].category).toBe('api');
      expect(result.apiRequests[1].category).toBe('api');
    });

    it('should detect failed requests', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 500,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://api.example.com/config',
          method: 'POST',
          status: 404,
          resourceType: 'xhr',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.failedRequests).toHaveLength(2);
      expect(result.failedRequests[0].success).toBe(false);
      expect(result.failedRequests[1].success).toBe(false);
    });

    it('should filter by resource type', () => {
      const handler = new NetworkHandler({ resourceTypes: ['xhr'] });
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://example.com/image.png',
          method: 'GET',
          status: 200,
          resourceType: 'image',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.totalRequests).toBe(1);
    });

    it('should filter by URL pattern', () => {
      const handler = new NetworkHandler({ urlPatterns: ['/api/'] });
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://example.com/static/script.js',
          method: 'GET',
          status: 200,
          resourceType: 'script',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.totalRequests).toBe(1);
    });

    it('should filter API requests only when apiOnly enabled', () => {
      const handler = new NetworkHandler({
        apiOnly: true,
        resourceTypes: ['xhr', 'fetch', 'script'] // Include all types for this test
      });
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/config',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://example.com/static/app.js',
          method: 'GET',
          status: 200,
          resourceType: 'script',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.totalRequests).toBe(1);
      expect(result.apiRequests).toHaveLength(1);
    });

    it('should count requests by type', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://api.example.com/config',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
        {
          reqid: 3,
          url: 'https://api.example.com/status',
          method: 'GET',
          status: 200,
          resourceType: 'fetch',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.countsByType['xhr']).toBe(2);
      expect(result.countsByType['fetch']).toBe(1);
    });

    it('should count requests by status', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://api.example.com/config',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
        {
          reqid: 3,
          url: 'https://api.example.com/error',
          method: 'GET',
          status: 500,
          resourceType: 'xhr',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.countsByStatus[200]).toBe(1);
      expect(result.countsByStatus[201]).toBe(1);
      expect(result.countsByStatus[500]).toBe(1);
    });

    it('should extract API endpoints', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://console.example.com/api/config/namespaces/default/origin_pools',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
      ];

      const result = handler.processRequests(requests);

      expect(result.apiRequests[0].apiEndpoint).toBe(
        '/api/config/namespaces/default/origin_pools'
      );
    });
  });

  describe('formatRequests', () => {
    it('should format API requests', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      const result = handler.processRequests(requests);
      const formatted = handler.formatRequests(result);

      expect(formatted).toContain('## Network Requests');
      expect(formatted).toContain('### API Requests');
      expect(formatted).toContain('GET');
      expect(formatted).toContain('✅');
    });

    it('should format failed requests', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/error',
          method: 'GET',
          status: 500,
          resourceType: 'xhr',
        },
      ];

      const result = handler.processRequests(requests);
      const formatted = handler.formatRequests(result);

      expect(formatted).toContain('### Failed Requests');
      expect(formatted).toContain('❌');
    });
  });

  describe('validateApiCall', () => {
    it('should validate endpoint was called by string pattern', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/config/origin_pools',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
      ];

      const result = handler.validateApiCall(requests, 'origin_pools');
      expect(result).toBe(true);
    });

    it('should validate endpoint was called by regex', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/config/namespaces/default/origin_pools',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
      ];

      const result = handler.validateApiCall(requests, /POST.*\/origin_pools/);
      expect(result).toBe(true);
    });

    it('should return false when endpoint not called', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/config/healthchecks',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
      ];

      const result = handler.validateApiCall(requests, 'origin_pools');
      expect(result).toBe(false);
    });
  });

  describe('getApiEndpoints', () => {
    it('should extract unique API endpoints', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/config/origin_pools',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://example.com/api/config/origin_pools',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
        {
          reqid: 3,
          url: 'https://example.com/api/data/health_status',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      const endpoints = handler.getApiEndpoints(requests);

      expect(endpoints).toHaveLength(2);
      expect(endpoints).toContain('/api/config/origin_pools');
      expect(endpoints).toContain('/api/data/health_status');
    });

    it('should sort endpoints alphabetically', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/web/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://example.com/api/config/resources',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      const endpoints = handler.getApiEndpoints(requests);

      expect(endpoints[0]).toBe('/api/config/resources');
      expect(endpoints[1]).toBe('/api/web/data');
    });
  });

  describe('hasFailures', () => {
    it('should detect failures', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/error',
          method: 'GET',
          status: 500,
          resourceType: 'xhr',
        },
      ];

      expect(handler.hasFailures(requests)).toBe(true);
    });

    it('should return false when no failures', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      expect(handler.hasFailures(requests)).toBe(false);
    });
  });

  describe('getFailedRequests', () => {
    it('should filter failed requests', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://api.example.com/error',
          method: 'GET',
          status: 500,
          resourceType: 'xhr',
        },
      ];

      const failed = handler.getFailedRequests(requests);

      expect(failed).toHaveLength(1);
      expect(failed[0].status).toBe(500);
    });
  });

  describe('filterApiRequests', () => {
    it('should filter to API requests only', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://example.com/static/app.js',
          method: 'GET',
          status: 200,
          resourceType: 'script',
        },
      ];

      const apiRequests = handler.filterApiRequests(requests);

      expect(apiRequests).toHaveLength(1);
      expect(apiRequests[0].url).toContain('/api/');
    });
  });

  describe('groupByEndpoint', () => {
    it('should group requests by endpoint', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/config/pools',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
        {
          reqid: 2,
          url: 'https://example.com/api/config/pools',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
        {
          reqid: 3,
          url: 'https://example.com/api/data/health',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      const grouped = handler.groupByEndpoint(requests);

      expect(grouped['/api/config/pools']).toHaveLength(2);
      expect(grouped['/api/data/health']).toHaveLength(1);
    });
  });

  describe('detectRateLimiting', () => {
    it('should detect 429 status', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 429,
          resourceType: 'xhr',
        },
      ];

      expect(handler.detectRateLimiting(requests)).toBe(true);
    });

    it('should return false when no rate limiting', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      expect(handler.detectRateLimiting(requests)).toBe(false);
    });
  });

  describe('detectAuthFailures', () => {
    it('should detect 401 status', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 401,
          resourceType: 'xhr',
        },
      ];

      expect(handler.detectAuthFailures(requests)).toBe(true);
    });

    it('should detect 403 status', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 403,
          resourceType: 'xhr',
        },
      ];

      expect(handler.detectAuthFailures(requests)).toBe(true);
    });

    it('should return false when no auth failures', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      expect(handler.detectAuthFailures(requests)).toBe(false);
    });
  });

  describe('singleton functions', () => {
    it('should return same instance', () => {
      const instance1 = getNetworkHandler();
      const instance2 = getNetworkHandler();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = getNetworkHandler();
      resetNetworkHandler();
      const instance2 = getNetworkHandler();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('utility functions', () => {
    it('should process requests with utility function', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      const result = processNetworkRequests(requests);

      expect(result.totalRequests).toBe(1);
    });

    it('should check for API calls with utility function', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      const result = hasApiCalls(requests);

      expect(result).toBe(true);
    });

    it('should format requests with utility function', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          resourceType: 'xhr',
        },
      ];

      const formatted = formatNetworkRequests(requests);

      expect(formatted).toContain('Network Requests');
    });

    it('should validate endpoint with utility function', () => {
      const requests: NetworkRequest[] = [
        {
          reqid: 1,
          url: 'https://example.com/api/config/pools',
          method: 'POST',
          status: 201,
          resourceType: 'xhr',
        },
      ];

      const result = validateApiEndpoint(requests, /pools/);

      expect(result).toBe(true);
    });
  });
});
