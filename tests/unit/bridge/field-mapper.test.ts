// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Field Mapper Tests
 *
 * Tests for mapping UI field names to API property paths.
 */

import { FieldMapper } from '../../../src/bridge/field-mapper';
import * as path from 'path';

describe('FieldMapper', () => {
  let mapper: FieldMapper;
  const mappingsPath = path.resolve(__dirname, '../../../config/field-mappings.yaml');

  beforeEach(() => {
    mapper = new FieldMapper();
  });

  describe('loadMappings', () => {
    it('should load mappings from YAML file successfully', async () => {
      await mapper.loadMappings(mappingsPath);
      expect(mapper.isLoaded()).toBe(true);
    });

    it('should throw error if file does not exist', async () => {
      await expect(mapper.loadMappings('non-existent.yaml')).rejects.toThrow();
    });
  });

  describe('loadMappingsSync', () => {
    it('should load mappings synchronously', () => {
      mapper.loadMappingsSync(mappingsPath);
      expect(mapper.isLoaded()).toBe(true);
    });
  });

  describe('mapFieldToApiProperty', () => {
    beforeEach(async () => {
      await mapper.loadMappings(mappingsPath);
    });

    it('should map common field name to metadata.name', () => {
      const result = mapper.mapFieldToApiProperty('healthcheck', 'name');

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('metadata.name');
      expect(result!.isUIOnly).toBe(false);
      expect(result!.source).toBe('common');
    });

    it('should map labels to metadata.labels', () => {
      const result = mapper.mapFieldToApiProperty('healthcheck', 'labels');

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('metadata.labels');
    });

    it('should map timeout to timeout', () => {
      const result = mapper.mapFieldToApiProperty('healthcheck', 'timeout');

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('timeout');
    });

    it('should identify UI-only fields', () => {
      const result = mapper.mapFieldToApiProperty('healthcheck', 'show_advanced_fields');

      expect(result).not.toBeNull();
      expect(result!.isUIOnly).toBe(true);
      expect(result!.apiProperty).toBe('__ui_only__');
    });

    it('should handle field name normalization', () => {
      // "Jitter Percent" → "jitter_percent"
      const result = mapper.mapFieldToApiProperty('healthcheck', 'Jitter Percent');

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('jitter_percent');
    });

    it('should return null for unknown fields', () => {
      const result = mapper.mapFieldToApiProperty('healthcheck', 'unknown_field');

      expect(result).toBeNull();
    });

    it('should return null for unknown resource types', () => {
      const result = mapper.mapFieldToApiProperty('unknown_resource', 'name');

      expect(result).toBeNull();
    });
  });

  describe('mapDiscriminatorField', () => {
    beforeEach(async () => {
      await mapper.loadMappings(mappingsPath);
    });

    it('should map HTTP HealthCheck option to http_health_check', () => {
      const result = mapper.mapDiscriminatorField(
        'healthcheck',
        'health_check',
        'HTTP HealthCheck'
      );

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('http_health_check');
      expect(result!.source).toBe('discriminator');
    });

    it('should map TCP HealthCheck option to tcp_health_check', () => {
      const result = mapper.mapDiscriminatorField(
        'healthcheck',
        'health_check',
        'TCP HealthCheck'
      );

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('tcp_health_check');
    });

    it('should map ICMP HealthCheck option to icmp_ping_health_check', () => {
      const result = mapper.mapDiscriminatorField(
        'healthcheck',
        'health_check',
        'ICMP HealthCheck'
      );

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('icmp_ping_health_check');
    });

    it('should return null for unknown discriminator fields', () => {
      const result = mapper.mapDiscriminatorField(
        'healthcheck',
        'unknown_discriminator',
        'HTTP'
      );

      expect(result).toBeNull();
    });

    it('should return null for unknown option values', () => {
      const result = mapper.mapDiscriminatorField(
        'healthcheck',
        'health_check',
        'Unknown Option'
      );

      expect(result).toBeNull();
    });
  });

  describe('mapNestedConfigField', () => {
    beforeEach(async () => {
      await mapper.loadMappings(mappingsPath);
    });

    it('should map HTTP nested config path field', () => {
      const result = mapper.mapNestedConfigField(
        'healthcheck',
        'http_health_check',
        'path'
      );

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('http_health_check.path');
      expect(result!.source).toBe('nested');
    });

    it('should map HTTP nested config use_http2 field', () => {
      const result = mapper.mapNestedConfigField(
        'healthcheck',
        'http_health_check',
        'use_http2'
      );

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('http_health_check.use_http2');
    });

    it('should map TCP nested config send_payload field', () => {
      const result = mapper.mapNestedConfigField(
        'healthcheck',
        'tcp_health_check',
        'send_payload'
      );

      expect(result).not.toBeNull();
      expect(result!.apiProperty).toBe('tcp_health_check.send_payload.text');
    });

    it('should return null for unknown nested configs', () => {
      const result = mapper.mapNestedConfigField(
        'healthcheck',
        'unknown_config',
        'path'
      );

      expect(result).toBeNull();
    });

    it('should return null for unknown fields within nested config', () => {
      const result = mapper.mapNestedConfigField(
        'healthcheck',
        'http_health_check',
        'unknown_field'
      );

      expect(result).toBeNull();
    });
  });

  describe('getValidationRules', () => {
    beforeEach(async () => {
      await mapper.loadMappings(mappingsPath);
    });

    it('should return validation rules for healthcheck', () => {
      const rules = mapper.getValidationRules('healthcheck');

      expect(rules).not.toBeNull();
      expect(rules!.required_api_fields).toContain('metadata.name');
      expect(rules!.required_api_fields).toContain('timeout');
      expect(rules!.mutually_exclusive).toBeDefined();
    });

    it('should return null for unknown resource types', () => {
      const rules = mapper.getValidationRules('unknown_resource');

      expect(rules).toBeNull();
    });
  });

  describe('validateMappings', () => {
    beforeEach(async () => {
      await mapper.loadMappings(mappingsPath);
    });

    it('should validate that required fields are present', () => {
      const apiProperties = [
        'metadata.name',
        'timeout',
        'interval',
        'unhealthy_threshold',
        'healthy_threshold',
        'http_health_check',
      ];

      const result = mapper.validateMappings('healthcheck', apiProperties);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const apiProperties = ['metadata.name']; // Missing timeout and other required fields

      const result = mapper.validateMappings('healthcheck', apiProperties);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required API fields');
    });

    it('should detect mutually exclusive field violations', () => {
      const apiProperties = [
        'metadata.name',
        'timeout',
        'interval',
        'unhealthy_threshold',
        'healthy_threshold',
        'http_health_check', // Mutually exclusive with tcp_health_check
        'tcp_health_check',  // Violation: both present
      ];

      const result = mapper.validateMappings('healthcheck', apiProperties);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Mutually exclusive fields present');
    });

    it('should allow only one health check type (valid case)', () => {
      const apiProperties = [
        'metadata.name',
        'timeout',
        'interval',
        'unhealthy_threshold',
        'healthy_threshold',
        'http_health_check', // Only HTTP, no TCP or ICMP
      ];

      const result = mapper.validateMappings('healthcheck', apiProperties);

      expect(result.valid).toBe(true);
    });
  });

  describe('getUIOnlyFields', () => {
    beforeEach(async () => {
      await mapper.loadMappings(mappingsPath);
    });

    it('should return list of UI-only fields', () => {
      const uiOnlyFields = mapper.getUIOnlyFields('healthcheck');

      expect(uiOnlyFields).toContain('show_advanced_fields');
    });

    it('should return empty array for resource without UI-only fields', () => {
      // Most resources won't have UI-only fields
      const uiOnlyFields = mapper.getUIOnlyFields('origin_pool');

      expect(Array.isArray(uiOnlyFields)).toBe(true);
    });
  });

  describe('getResourceMappings', () => {
    beforeEach(async () => {
      await mapper.loadMappings(mappingsPath);
    });

    it('should return complete resource mappings', () => {
      const mappings = mapper.getResourceMappings('healthcheck');

      expect(mappings).not.toBeNull();
      expect(mappings!.description).toBeDefined();
      expect(mappings!.common_fields).toBeDefined();
      expect(mappings!.discriminator_fields).toBeDefined();
      expect(mappings!.nested_configs).toBeDefined();
    });

    it('should return null for non-resource entries', () => {
      const mappings = mapper.getResourceMappings('version'); // metadata field

      expect(mappings).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should throw error if trying to use before loading', () => {
      expect(() => {
        mapper.mapFieldToApiProperty('healthcheck', 'name');
      }).toThrow('Field mappings not loaded');
    });

    it('should throw error if trying to reload without initial load', async () => {
      await expect(mapper.reloadMappings()).rejects.toThrow(
        'No configuration path set'
      );
    });
  });

  describe('reloadMappings', () => {
    it('should reload mappings from file', async () => {
      await mapper.loadMappings(mappingsPath);

      const result1 = mapper.mapFieldToApiProperty('healthcheck', 'name');
      expect(result1).not.toBeNull();

      await mapper.reloadMappings();

      const result2 = mapper.mapFieldToApiProperty('healthcheck', 'name');
      expect(result2).not.toBeNull();
      expect(result2!.apiProperty).toBe(result1!.apiProperty);
    });
  });

  describe('getConfigPath', () => {
    it('should return null before loading', () => {
      expect(mapper.getConfigPath()).toBeNull();
    });

    it('should return config path after loading', async () => {
      await mapper.loadMappings(mappingsPath);
      expect(mapper.getConfigPath()).toBe(mappingsPath);
    });
  });
});
